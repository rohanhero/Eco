import math
import datetime
from django.db.models import Q
from ..models import Report
from PIL import Image, ImageStat, ImageOps
import os
import hashlib


class DuplicateDetector:
    def __init__(self, similarity_threshold=0.45, location_radius_km=1.0, time_window_days=30, image_similarity_threshold=0.8):
        """
        Initialize duplicate detector with configurable thresholds

        Args:
            similarity_threshold: Minimum combined similarity score (0-1)
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

            location_distance = None
            location_score = 0.5
            if new_location[0] and new_location[1] and report.location_lat and report.location_lng:
                distance = self._calculate_distance(
                    new_location, (report.location_lat, report.location_lng))
                location_distance = distance
                if distance <= self.location_radius_km:
                    location_score = max(
                        0.0, 1 - (distance / self.location_radius_km))
                else:
                    location_score = 0.0

            combined_similarity = (
                text_similarity * 0.4 +
                image_similarity * 0.4 +
                location_score * 0.2
            )

            strong_image_match = image_similarity >= self.image_similarity_threshold
            location_ok = location_distance is None or location_distance <= self.location_radius_km

            if strong_image_match or (combined_similarity >= self.similarity_threshold and location_ok):
                potential_duplicates.append({
                    'report': report,
                    'similarity_score': max(combined_similarity, image_similarity),
                    'text_similarity': text_similarity,
                    'image_similarity': image_similarity,
                    'location_distance_km': location_distance
                })

        # Sort by similarity score (highest first)
        potential_duplicates.sort(
            key=lambda x: x['similarity_score'], reverse=True)

        return potential_duplicates[:5]  # Return top 5 most similar

    def _normalize_text(self, text):
        text = text.lower()
        for ch in ".,;:!?()\"'/\\\n\t-":
            text = text.replace(ch, " ")
        return " ".join(text.split())

    def _make_ngrams(self, tokens, n):
        if len(tokens) < n:
            return set()
        return {" ".join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)}

    def _jaccard_similarity(self, set1, set2):
        if not set1 or not set2:
            return 0.0
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        return len(intersection) / len(union) if union else 0.0

    def _calculate_text_similarities(self, new_text, existing_texts):
        """
        Calculate text similarity using token and n-gram Jaccard similarity.
        """
        if not existing_texts:
            return []

        normalized_new = self._normalize_text(new_text)
        new_tokens = normalized_new.split()
        new_unigrams = set(new_tokens)
        new_bigrams = self._make_ngrams(new_tokens, 2)
        new_trigrams = self._make_ngrams(new_tokens, 3)

        similarities = []
        for existing_text in existing_texts:
            normalized_existing = self._normalize_text(existing_text)
            existing_tokens = normalized_existing.split()
            existing_unigrams = set(existing_tokens)
            existing_bigrams = self._make_ngrams(existing_tokens, 2)
            existing_trigrams = self._make_ngrams(existing_tokens, 3)

            unigram_sim = self._jaccard_similarity(
                new_unigrams, existing_unigrams)
            bigram_sim = self._jaccard_similarity(
                new_bigrams, existing_bigrams)
            trigram_sim = self._jaccard_similarity(
                new_trigrams, existing_trigrams)

            combined_text_similarity = (
                unigram_sim * 0.5 +
                bigram_sim * 0.3 +
                trigram_sim * 0.2
            )
            similarities.append(combined_text_similarity)

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
        Calculate similarity between two images using multiple metrics.
        Returns similarity score between 0 and 1.
        """
        try:
            if not os.path.exists(image_path1) or not os.path.exists(image_path2):
                return 0.0

            if image_path1 == image_path2:
                return 1.0

            if self._calculate_file_hash(image_path1) == self._calculate_file_hash(image_path2):
                return 1.0

            img1 = Image.open(image_path1)
            img2 = Image.open(image_path2)
            img1 = ImageOps.exif_transpose(img1).convert('RGB')
            img2 = ImageOps.exif_transpose(img2).convert('RGB')

            size_similarity = self._calculate_size_similarity(img1, img2)
            color_similarity = self._calculate_color_similarity(img1, img2)
            histogram_similarity = self._calculate_histogram_similarity(
                img1, img2)
            ahash_similarity = self._calculate_hash_similarity(
                img1, img2, method='average')
            dhash_similarity = self._calculate_hash_similarity(
                img1, img2, method='difference')

            hash_similarity = (ahash_similarity + dhash_similarity) / 2.0

            final_similarity = (
                hash_similarity * 0.5 +
                histogram_similarity * 0.25 +
                color_similarity * 0.15 +
                size_similarity * 0.10
            )

            return max(0.0, min(1.0, final_similarity))

        except Exception as e:
            print(f"Error comparing images: {e}")
            return 0.0

    def _calculate_file_hash(self, image_path, algorithm='md5'):
        hasher = hashlib.new(algorithm)
        with open(image_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def _calculate_size_similarity(self, img1, img2):
        width1, height1 = img1.size
        width2, height2 = img2.size
        if width1 == 0 or height1 == 0 or width2 == 0 or height2 == 0:
            return 0.0

        area1 = width1 * height1
        area2 = width2 * height2
        if area1 == 0 or area2 == 0:
            return 0.0

        area_similarity = 1 - abs(area1 - area2) / max(area1, area2)
        aspect1 = width1 / height1
        aspect2 = width2 / height2
        aspect_similarity = 1 - abs(aspect1 - aspect2) / max(aspect1, aspect2)

        return max(0.0, min(1.0, (area_similarity * 0.6 + aspect_similarity * 0.4)))

    def _calculate_color_similarity(self, img1, img2):
        stat1 = ImageStat.Stat(img1)
        stat2 = ImageStat.Stat(img2)
        mean1 = stat1.mean
        mean2 = stat2.mean

        color_distance = math.sqrt(
            sum((a - b) ** 2 for a, b in zip(mean1, mean2)))
        max_color_distance = math.sqrt(3 * (255 ** 2))
        return max(0.0, 1 - (color_distance / max_color_distance))

    def _calculate_histogram_similarity(self, img1, img2):
        hist1 = img1.histogram()
        hist2 = img2.histogram()
        if len(hist1) != len(hist2):
            return 0.0

        min_sum = 0
        total = 0
        for a, b in zip(hist1, hist2):
            min_sum += min(a, b)
            total += max(a, b)

        return max(0.0, min_sum / total) if total > 0 else 0.0

    def _calculate_hash_similarity(self, image1, image2, method='difference', hash_size=8):
        if method == 'average':
            hash1 = self._calculate_average_hash(image1, hash_size)
            hash2 = self._calculate_average_hash(image2, hash_size)
        else:
            hash1 = self._calculate_difference_hash(image1, hash_size)
            hash2 = self._calculate_difference_hash(image2, hash_size)

        distance = self._hamming_distance(hash1, hash2)
        return max(0.0, 1 - (distance / (hash_size * hash_size)))

    def _calculate_average_hash(self, image, hash_size=8):
        image = image.convert('L').resize(
            (hash_size, hash_size), Image.Resampling.LANCZOS)
        pixels = list(image.getdata())
        avg = sum(pixels) / len(pixels)

        hash_value = 0
        for idx, pixel in enumerate(pixels):
            if pixel >= avg:
                hash_value |= 1 << idx
        return hash_value

    def _calculate_difference_hash(self, image, hash_size=8):
        image = image.convert('L').resize(
            (hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        pixels = list(image.getdata())
        width, height = image.size

        hash_value = 0
        for y in range(height):
            for x in range(width - 1):
                left = pixels[y * width + x]
                right = pixels[y * width + x + 1]
                if left > right:
                    hash_value |= 1 << (y * (width - 1) + x)
        return hash_value

    def _hamming_distance(self, hash1, hash2):
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
