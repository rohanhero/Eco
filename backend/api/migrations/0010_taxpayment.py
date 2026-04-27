from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import decimal


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_signupotp_user_to_email'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaxPayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('pid', models.CharField(editable=False, max_length=128, unique=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, validators=[
                 django.core.validators.MinValueValidator(decimal.Decimal('0.01'))])),
                ('tax_period', models.CharField(blank=True, max_length=128)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), (
                    'success', 'Success'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('esewa_ref', models.CharField(
                    blank=True, max_length=128, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='tax_payments', to='api.customuser')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
