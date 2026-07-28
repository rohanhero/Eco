from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_customuser_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('inprogress', 'In Progress'), (
                'resolved', 'Resolved')], default='pending', max_length=20),
        ),
    ]
