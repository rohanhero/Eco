from django.core.management.base import BaseCommand
from api.models import Report, CustomUser
from api.utils.duplicate_detector import check_report_duplicates, DuplicateDetector
import json


class Command(BaseCommand):
    help = 'Test duplicate report detection'

    def add_arguments(self, parser):
        parser.add_argument(
            '--report-id',
            type=int,
            help='ID of existing report to check for duplicates',
        )
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create some test reports for duplicate detection',
        )

    def handle(self, *args, **options):
        if options['create_test_data']:
            self.create_test_reports()
            return

        if options['report_id']:
            self.test_duplicate_detection(options['report_id'])
        else:
            self.stdout.write(
                self.style.WARNING(
                    'Please provide --report-id or --create-test-data')
            )

    def create_test_reports(self):
        """Create some test reports for duplicate detection testing"""
        # Get or create a test user
        user, created = CustomUser.objects.get_or_create(
            email='test@example.com',
            defaults={'name': 'Test User'}
        )
        if created:
            user.set_password('testpass123')
            user.save()

        # Create test reports
        test_reports = [
            {
                'title': 'Pothole on Main Street',
                'description': 'There is a large pothole on Main Street near the intersection with Oak Avenue. It is very dangerous for vehicles.',
                'category': 'road',
                'severity': 'medium',
                'location_lat': 27.7172,
                'location_lng': 85.3240,
            },
            {
                'title': 'Pothole on Main Street',
                'description': 'Large pothole on Main Street close to Oak Avenue intersection. Vehicles are having trouble.',
                'category': 'road',
                'severity': 'high',
                'location_lat': 27.7175,
                'location_lng': 85.3242,
            },
            {
                'title': 'Broken Street Light',
                'description': 'The street light at the corner of Main and Oak is not working. The area is very dark at night.',
                'category': 'electricity',
                'severity': 'medium',
                'location_lat': 27.7180,
                'location_lng': 85.3250,
            },
            {
                'title': 'Garbage Pile on Sidewalk',
                'description': 'There is a large pile of garbage on the sidewalk near the park entrance. It smells bad and attracts pests.',
                'category': 'waste',
                'severity': 'low',
                'location_lat': 27.7200,
                'location_lng': 85.3300,
            },
            {
                'title': 'Garbage Accumulation',
                'description': 'Excessive garbage has accumulated near the park. This is creating an unpleasant environment.',
                'category': 'waste',
                'severity': 'medium',
                'location_lat': 27.7202,
                'location_lng': 85.3301,
            },
        ]

        created_reports = []
        for report_data in test_reports:
            report = Report.objects.create(
                user=user,
                name=user.name,
                email=user.email,
                **report_data
            )
            created_reports.append(report)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created report: {report.title} (ID: {report.id})')
            )

        self.stdout.write(
            self.style.SUCCESS(f'Created {len(created_reports)} test reports')
        )

    def test_duplicate_detection(self, report_id):
        """Test duplicate detection for a specific report"""
        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Report with ID {report_id} does not exist')
            )
            return

        self.stdout.write(
            f'Testing duplicate detection for report: "{report.title}"')
        self.stdout.write(f'Category: {report.category}')
        self.stdout.write(f'Description: {report.description[:100]}...')

        # Prepare report data for duplicate checking
        report_data = {
            'title': report.title,
            'description': report.description,
            'category': report.category,
            'location_lat': report.location_lat,
            'location_lng': report.location_lng,
            'user_id': report.user.id
        }

        # Find duplicates with lower threshold and longer time window for testing
        # Lower threshold and longer time window
        detector = DuplicateDetector(
            similarity_threshold=0.3, time_window_days=365)
        duplicates = detector.find_duplicates(report_data)

        self.stdout.write(
            f'Similarity threshold: {detector.similarity_threshold}')
        self.stdout.write(f'Time window: {detector.time_window_days} days')
        self.stdout.write(f'Found {len(duplicates)} potential duplicates:')

        if duplicates:
            for i, dup in enumerate(duplicates, 1):
                self.stdout.write(
                    f'{i}. "{dup["report"].title}" - Similarity: {dup["similarity_score"]:.2f}'
                )
                if dup.get('location_distance_km') is not None:
                    self.stdout.write(
                        f'   Distance: {dup["location_distance_km"]:.2f} km'
                    )
        else:
            self.stdout.write(
                self.style.WARNING('No potential duplicates found')
            )
