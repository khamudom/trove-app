import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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

interface LabelContentProps {
  binName: string
  dataUrl: string
  className: string
}

function LabelContent({ binName, dataUrl, className }: LabelContentProps) {
  return (
    <div className={className}>
      <p className={printStyles.wordmark}>Trove</p>
      <h2 className={printStyles.binName}>{binName}</h2>
      <div className={printStyles.qrWrap}>
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${binName}`} className={printStyles.qrImage} />
        ) : (
          <div className={printStyles.qrImage} aria-hidden />
        )}
      </div>
      <p className={printStyles.cta}>Scan to see what's inside</p>
    </div>
  )
}

export function QRLabel({ binName, qrToken, onClose }: QRLabelProps) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    void QRCode.toDataURL(getQrUrl(qrToken), { margin: 1, width: 360 }).then(setDataUrl)
  }, [qrToken])

  const printTarget =
    typeof document !== 'undefined'
      ? createPortal(
          <LabelContent
            binName={binName}
            dataUrl={dataUrl}
            className={`print-area ${printStyles.printLabel} ${printStyles.printOnly}`}
          />,
          document.body,
        )
      : null

  return (
    <>
      {printTarget}
      <div className={styles.wrapper}>
        <LabelContent
          binName={binName}
          dataUrl={dataUrl}
          className={`${printStyles.printLabel} ${printStyles.screenPreview}`}
        />
        <div className={printStyles.actions}>
          <Button disabled={!dataUrl} onClick={() => window.print()}>
            Print label
          </Button>
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
