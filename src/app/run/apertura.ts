// Cuándo se destraban públicamente los botones de compra.
//
// Ojo: quien de verdad abre la venta es el estado `venta_abierta` del evento
// en la base, que se prende con `scripts/run-abrir-venta.mjs`. Este reloj
// vive aparte porque mientras el back se afina la base se prende para probar
// y ese cambio se propaga a producción — necesitamos una segunda puerta,
// controlada por la UI, para que la portada siga cerrada hasta esta fecha
// aunque la base diga que abrió.
//
// Cuando la venta abra de verdad hay que devolver los `<Link>` a los botones
// que hoy usan <BotonBloqueado> y quitar la prop `bloqueado` de <RunNav>.
export const VENTA_ABRE_ISO = "2026-08-19T00:00:00-06:00";
