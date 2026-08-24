import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@khamudom/lumen-ui-react'
import { getQrUrl } from '@/lib/utils'
import printStyles from '@/styles/print.module.css'
import styles from './QRLabel.module.css'

interface QRLabelProps {
  binName: string
  qrToken: string
  onClose?: () => void
}

function printLabel(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement
  const root = document.createElement('div')
  root.id = 'print-label-root'
  root.appendChild(clone)
  document.body.appendChild(root)

  const cleanup = () => {
    root.remove()
    window.removeEventListener('afterprint', cleanup)
  }

  window.addEventListener('afterprint', cleanup)
  window.print()
}

export function QRLabel({ binName, qrToken, onClose }: QRLabelProps) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    void QRCode.toDataURL(getQrUrl(qrToken), { margin: 1, width: 360 }).then(setDataUrl)
  }, [qrToken])

  const handlePrint = () => {
    const source = document.querySelector<HTMLElement>('.print-area')
    if (source) printLabel(source)
  }

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
        <Button disabled={!dataUrl} onClick={handlePrint}>
          Print label
        </Button>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  )
}
