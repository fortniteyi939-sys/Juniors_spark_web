import iconUrl from '@/assets/brand/icon.png'
import logoDarkUrl from '@/assets/brand/logo-dark.png'
import logoLightUrl from '@/assets/brand/logo-light.png'

/**
 * Marca Junior's Sparks. Se renderizan las dos versiones del logo y el CSS muestra la que corresponde
 * a `<html data-theme>` (sin parpadeo al cambiar de tema). En pantallas angostas se usa solo el icono.
 */
export function BrandLogo() {
  return (
    <>
      <img className="brand-logo is-light" src={logoLightUrl} alt="Junior's Sparks" width={196} height={38} />
      <img className="brand-logo is-dark" src={logoDarkUrl} alt="Junior's Sparks" width={196} height={44} />
      <img className="brand-icon" src={iconUrl} alt="Junior's Sparks" width={36} height={36} />
    </>
  )
}
