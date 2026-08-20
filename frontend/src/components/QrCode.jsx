import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrCode({ value, size = 180 }) {
  const [image, setImage] = useState('')

  useEffect(() => {
    let active = true

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M'
    }).then(url => {
      if (active) setImage(url)
    }).catch(() => {
      if (active) setImage('')
    })

    return () => { active = false }
  }, [value, size])

  return image ? <img className="qr-image" alt="QR code" src={image} /> : <p className="error-text">QR code could not be generated.</p>
}
