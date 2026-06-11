from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, Http404


def admin_app(request, path=""):
    dist_root = settings.BASE_DIR.parent / "frontend" / "dist"
    index_path = dist_root / "index.html"
    if not index_path.exists():
        raise Http404(
            "Admin frontend not built. Run npm run build in frontend.")

    html = index_path.read_text(encoding="utf-8")
    return HttpResponse(html, content_type="text/html")
