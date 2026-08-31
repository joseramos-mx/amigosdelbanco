import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const isStaffRoute = request.nextUrl.pathname.startsWith('/run/staff')
  const isLoginRoute = request.nextUrl.pathname === '/run/login'
  
  // Rutas de API exclusivas para el staff que requieren sesión
  const protectedApis = ['/api/run/checkin', '/api/run/cortesias', '/api/run/dorsales', '/api/run/export', '/api/run/staff']
  const isApiAuthRoute = protectedApis.some(route => request.nextUrl.pathname.startsWith(route))

  // 1. Si es una ruta completamente pública que no requiere sesión, 
  // no hacemos la llamada de red a Supabase para ahorrar latencia.
  if (!isStaffRoute && !isLoginRoute && !isApiAuthRoute) {
    return supabaseResponse
  }

  // 2. Solo para las rutas protegidas, validamos y refrescamos la sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isStaffRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/run/login'
    return NextResponse.redirect(url)
  }

  if (isApiAuthRoute && !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/run/staff'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
