import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getQrUrl } from '@/lib/utils'
import { Button } from './Button'
import printStyles from '@/styles/print.module.css'
import styles from './QRLabel.module.css'

interface QRLabelProps {
  binName: string
  qrToken: string
  onClose?: () => void
}

export function QRLabel({ binName, qrToken, onClose }: QRLabelProps) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    void QRCode.toDataURL(getQrUrl(qrToken), { margin: 1, width: 360 }).then(setDataUrl)
  }, [qrToken])

  return (
    <div className={styles.wrapper}>
      <div className={`print-area ${printStyles.printLabel}`}>
        <p className={printStyles.wordmark}>Trove</p>
        <h2 className={printStyles.binName}>{binName}</h2>
        <div className={printStyles.qrWrap}>
          {dataUrl && <img src={dataUrl} alt={`QR code for ${binName}`} className={printStyles.qrImage} />}
        </div>
        <p className={printStyles.cta}>Scan to see what's inside</p>
      </div>
      <div className={printStyles.actions}>
        <Button onClick={() => window.print()}>Print label</Button>
        {onClose && <Button variant="secondary" onClick={onClose}>Done</Button>}
      </div>
    </div>
  )
}
