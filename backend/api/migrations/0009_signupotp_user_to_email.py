from django.db import migrations, models


def forwards(apps, schema_editor):
    SignupOTP = apps.get_model("api", "SignupOTP")
    CustomUser = apps.get_model("api", "CustomUser")
    for otp in SignupOTP.objects.all():
        try:
            if otp.user_id:
                user = CustomUser.objects.get(pk=otp.user_id)
                otp.email = user.email
                otp.save()
        except Exception:
            # skip problematic rows
            continue


def backwards(apps, schema_editor):
    SignupOTP = apps.get_model("api", "SignupOTP")
    CustomUser = apps.get_model("api", "CustomUser")
    for otp in SignupOTP.objects.all():
        try:
            if otp.email:
                user = CustomUser.objects.filter(email=otp.email).first()
                if user:
                    otp.user_id = user.id
                    otp.save()
        except Exception:
            continue


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_alter_comment_rating_signupotp"),
    ]

    operations = [
        migrations.AddField(
            model_name="signupotp",
            name="email",
            field=models.EmailField(max_length=254, null=True),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="signupotp",
            name="email",
            field=models.EmailField(max_length=254, unique=True),
        ),
        migrations.RemoveField(
            model_name="signupotp",
            name="user",
        ),
    ]
