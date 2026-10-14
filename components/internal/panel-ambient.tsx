// Fondo del panel: los orbes monocromos del sitio (panel.css). Las partículas vienen del layout raíz
// y el grano es .pn::after
export function PanelAmbient() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -inset-[10%]">
        <div className="pn-orb pn-orb--a absolute rounded-full" />
        <div className="pn-orb pn-orb--b absolute rounded-full" />
        <div className="pn-orb pn-orb--c absolute rounded-full" />
        <div className="pn-orb pn-orb--d absolute rounded-full" />
      </div>
    </div>
  )
}
