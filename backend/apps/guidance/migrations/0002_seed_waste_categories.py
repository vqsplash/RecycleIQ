from django.db import migrations


CATEGORIES = (
    ("cardboard", "Cardboard", "Flatten boxes and keep cardboard dry. Confirm that your local program accepts it before recycling."),
    ("paper", "Paper", "Keep paper clean and dry, and separate non-paper materials. Check your local program for accepted paper types."),
    ("glass", "Glass", "Check which glass containers your local program accepts. Do not place loose broken glass in a recycling bin."),
    ("metal", "Metal", "Empty containers and check local guidance for accepted metal items. Never place pressurized or hazardous containers in recycling."),
    ("plastic", "Plastic", "Check the item and your local program's accepted plastics list; recycling symbols alone do not guarantee acceptance."),
    ("organic", "Organic Waste", "Use a locally supported composting or organic-waste service, and follow its accepted-materials guidance."),
)


def seed_categories(apps, schema_editor):
    WasteCategory = apps.get_model("guidance", "WasteCategory")
    GuidanceEntry = apps.get_model("guidance", "GuidanceEntry")
    database = schema_editor.connection.alias

    for slug, name, body in CATEGORIES:
        category, _ = WasteCategory.objects.using(database).get_or_create(
            slug=slug, defaults={"name": name}
        )
        GuidanceEntry.objects.using(database).get_or_create(
            category=category,
            defaults={"title": f"Recycling {name}", "body": body},
        )


class Migration(migrations.Migration):
    dependencies = [("guidance", "0001_initial")]

    operations = [migrations.RunPython(seed_categories, migrations.RunPython.noop)]