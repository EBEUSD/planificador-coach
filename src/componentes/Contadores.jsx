import { useEffect, useState } from 'react'
import s from '../estilos/Formularios.module.css'
import { listarClientes } from '../servicios/clientes.dexie'

export default function Contadores() {
  const [clientes, setClientes] = useState(0)
  useEffect(() => { (async () => setClientes((await listarClientes()).length))() }, [])
  return (
    <div className={s.row} style={{ margin: '8px 0' }}>
      <div className={s.badge}><strong>Clientes:</strong> {clientes}</div>
    </div>
  )
}
