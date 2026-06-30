import io
import qrcode
import qrcode.image.svg


def generate(uuid: str) -> io.BytesIO:

    factory = qrcode.image.svg.SvgImage
    img = qrcode.make(uuid, image_factory=factory)

    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)

    return buf