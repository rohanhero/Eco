import math
import datetime
from django.db.models import Q
from ..models import Report
from PIL import Image, ImageStat
import os
import hashlib


class DuplicateDetector:
    def __init__(self, similarity_threshold=0.3, location_radius_km=1.0, time_window_days=30, image_similarity_threshold=0.8):
        """
        Initialize duplicate detector with configurable thresholds

        Args:
            similarity_threshold: Minimum text similarity (0-1) to consider duplicate
            location_radius_km: Maximum distance in km for location similarity
            time_window_days: Only check reports within this many days
            image_similarity_threshold: Minimum image similarity (0-1) for visual duplicates
        """
        self.similarity_threshold = similarity_threshold
        self.location_radius_km = location_radius_km
        self.time_window_days = time_window_days
        self.image_similarity_threshold = image_similarity_threshold

    def find_duplicates(self, new_report_data):
        """
        Find potential duplicate reports for a new report

        Args:
            new_report_data: Dict with keys: title, description, category,
                           location_lat, location_lng, user_id, image (optional)

        Returns:
            List of potential duplicate reports with similarity scores
        """
        # Get recent reports in same category
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=self.time_window_days)

        recent_reports = Report.objects.filter(
            category=new_report_data['category'],
            created_at__gte=cutoff_date
            # Exclude user's own reports
        ).exclude(user_id=new_report_data['user_id'])

        if not recent_reports:
            return []

        # Prepare text data for similarity comparison
        new_text = f"{new_report_data['title']} {new_report_data['description']}"
        existing_texts = [f"{r.title} {r.description}" for r in recent_reports]

        # Calculate text similarities using simple Jaccard similarity
        text_similarities = self._calculate_text_similarities(
            new_text, existing_texts)

        # Calculate image similarities if new report has an image
        image_similarities = []
        new_image_path = new_report_data.get('image_path')
        if new_image_path and os.path.exists(new_image_path):
            for report in recent_reports:
                if report.image and os.path.exists(report.image.path):
                    similarity = self._calculate_image_similarity(
                        new_image_path, report.image.path)
                    image_similarities.append(similarity)
                else:
                    image_similarities.append(0.0)
        else:
            image_similarities = [0.0] * len(recent_reports)

        # Filter by location if coordinates provided
        potential_duplicates = []
        new_location = (new_report_data.get('location_lat'),
                        new_report_data.get('location_lng'))

        for i, report in enumerate(recent_reports):
            text_similarity = text_similarities[i]
            image_similarity = image_similarities[i]

            # Combined similarity score (weighted average)
            combined_similarity = (text_similarity * 0.7) + \
                (image_similarity * 0.3)

            # Check location proximity if both reports have coordinates
            location_similar = True
            location_distance = None
            if new_location[0] and new_location[1] and report.location_lat and report.location_lng:
                distance = self._calculate_distance(
                    new_location, (report.location_lat, report.location_lng))
                location_distance = distance
                location_similar = distance <= self.location_radius_km

            # Consider duplicate if combined similarity is high enough AND locations are close (if coordinates exist)
            if combined_similarity >= self.similarity_threshold and location_similar:
                potential_duplicates.append({
                    'report': report,
                    'similarity_score': combined_similarity,
                    'text_similarity': text_similarity,
                    'image_similarity': image_similarity,
                    'location_distance_km': location_distance
                })

        # Sort by similarity score (highest first)
        potential_duplicates.sort(
            key=lambda x: x['similarity_score'], reverse=True)

        return potential_duplicates[:5]  # Return top 5 most similar

    def _calculate_text_similarities(self, new_text, existing_texts):
        """
        Calculate Jaccard similarity between new text and existing texts
        """
        if not existing_texts:
            return []

        def jaccard_similarity(text1, text2):
            """Calculate Jaccard similarity between two texts"""
            # Simple tokenization (split by spaces and convert to lowercase)
            set1 = set(text1.lower().split())
            set2 = set(text2.lower().split())

            if not set1 or not set2:
                return 0.0

            intersection = set1.intersection(set2)
            union = set1.union(set2)

            return len(intersection) / len(union) if union else 0.0

        similarities = []
        for existing_text in existing_texts:
            similarity = jaccard_similarity(new_text, existing_text)
            similarities.append(similarity)

        return similarities

    def _calculate_distance(self, coord1, coord2):
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in kilometers
        """
        lat1, lon1 = coord1
        lat2, lon2 = coord2

        # Earth's radius in kilometers
        R = 6371.0

        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * \
            math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        return R * c

    def _calculate_image_similarity(self, image_path1, image_path2):
        """
        Calculate similarity between two images using basic features
        Returns similarity score between 0 and 1
        """
        try:
            # Open images
            img1 = Image.open(image_path1).convert('RGB')
            img2 = Image.open(image_path2).convert('RGB')

            # Calculate various similarity metrics
            similarities = []

            # 1. Dimension similarity (normalized difference)
            width1, height1 = img1.size
            width2, height2 = img2.size
            size_similarity = 1 - min(abs(width1 - width2) / max(width1, width2),
                                      abs(height1 - height2) / max(height1, height2))
            similarities.append(size_similarity)

            # 2. Average color similarity
            stat1 = ImageStat.Stat(img1)
            stat2 = ImageStat.Stat(img2)
            mean1 = stat1.mean
            mean2 = stat2.mean

            # Calculate Euclidean distance between average colors
            color_distance = math.sqrt(
                sum((a - b) ** 2 for a, b in zip(mean1, mean2)))
            max_color_distance = math.sqrt(
                3 * (255 ** 2))  # Maximum possible distance
            color_similarity = 1 - (color_distance / max_color_distance)
            similarities.append(color_similarity)

            # 3. Simple perceptual hash similarity (dhash)
            hash1 = self._calculate_image_hash(img1)
            hash2 = self._calculate_image_hash(img2)
            hash_similarity = 1 - \
                (self._hamming_distance(hash1, hash2) / 64.0)  # dhash is 64 bits
            similarities.append(hash_similarity)

            # Return weighted average
            weights = [0.2, 0.3, 0.5]  # Weight hash similarity highest
            return sum(s * w for s, w in zip(similarities, weights))

        except Exception as e:
            print(f"Error comparing images: {e}")
            return 0.0

    def _calculate_image_hash(self, image, hash_size=8):
        """
        Calculate dhash (difference hash) for image
        """
        # Resize image to hash_size + 1
        image = image.convert('L').resize(
            (hash_size + 1, hash_size), Image.Resampling.LANCZOS)

        # Calculate differences
        pixels = list(image.getdata())
        width, height = image.size

        hash_value = 0
        for y in range(height):
            for x in range(width - 1):
                left = pixels[y * width + x]
                right = pixels[y * width + x + 1]
                if left > right:
                    hash_value |= (1 << (y * (width - 1) + x))

        return hash_value

    def _hamming_distance(self, hash1, hash2):
        """
        Calculate Hamming distance between two hashes
        """
        return bin(hash1 ^ hash2).count('1')


def check_report_duplicates(report_data):
    """
    Convenience function to check for duplicate reports

    Args:
        report_data: Dict with report data

    Returns:
        List of potential duplicates
    """
    detector = DuplicateDetector()
    return detector.find_duplicates(report_data)
