import qrcode
import qrcode.image.svg
import io

def generate(uuid: str) -> io.BytesIO:
    img = qrcode.make(uuid, image_factory=qrcode.image.svg.SvgImage)

    buf = io.BytesIO()

    img.save(buf, format="PNG")

    buf.seek(0)

    return buf