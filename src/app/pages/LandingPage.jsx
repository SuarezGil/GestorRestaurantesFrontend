import { Link } from 'react-router-dom'
import logoImage from '../../assets/img/logoRestaurante.png'

const heroImage = logoImage
const testimonialsBg =
  'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1920&q=80'

const FloatingHeroIcons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
    <div className="absolute top-[20%] left-[10%] text-6xl opacity-30 animate-float-delayed">✨</div>
    <div className="absolute top-[35%] right-[15%] text-5xl opacity-40 animate-float">🔥</div>
    <div className="absolute bottom-[25%] left-[20%] text-7xl opacity-20 animate-float-reverse">🥩</div>
    <div className="absolute top-[15%] right-[30%] text-4xl opacity-30 animate-float-slow">🌶️</div>
  </div>
)

export const LandingPage = () => {
  const restaurantTypes = [
    {
      title: 'Comida China',
      description: 'Wok, noodles y sabores orientales auténticos.',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      delayClass: 'animate-fade-in-up-delay-1'
    },
    {
      title: 'Pollo',
      description: 'Pollo crujiente, asado y recetas caseras.',
      image:
        'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80',
      delayClass: 'animate-fade-in-up-delay-2'
    },
    {
      title: 'Parrilla',
      description: 'Cortes premium y especialidades a la brasa.',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      delayClass: 'animate-fade-in-up-delay-3'
    },
    {
      title: 'Comida Italiana',
      description: 'Pastas artesanales, pizzas y cocina mediterránea.',
      image:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      delayClass: 'animate-fade-in-up-delay-2'
    }
  ]

  const testimonials = [
    {
      name: 'Roger Valladares',
      message: 'Rica comida, años degustando su delicioso sabor. Muy recomendado.',
    },
    {
      name: 'Marcos García',
      message: 'Cumple medidas sanitarias, buen sabor y excelente servicio. Parqueo disponible.',
    },
    {
      name: 'Kenny Angel',
      message: 'La atención es muy buena y la comida deliciosa. Ideal para compartir en familia.',
    },
    {
      name: 'Zimri Jahadai',
      message: 'Gran ambientación, atención y platillos orientales. Regresaré cada vez que pueda.',
    },
    {
      name: 'Iosef Suarez',
      message: 'Excelente atención desde que llegamos, porciones generosas y sabor increíble. Volveré con mi familia.',
    },
    {
      name: 'Angel Reyes',
      message: 'Muy buen servicio, ambiente cómodo y comida bien preparada. Lo recomiendo para reuniones y celebraciones.',
    },
  ]

  return (
    <div className="bg-zinc-100 text-white">
      <section className="relative min-h-[120vh] overflow-hidden">
        <picture className="absolute inset-0 block h-full w-full bg-black">
          <img
            src={heroImage}
            alt="Platillo principal"
            className="h-full w-full object-contain object-center scale-105 animate-[pulse_10s_ease-in-out_infinite_alternate]"
          />
        </picture>

        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        
        <FloatingHeroIcons />

        <header className="relative z-30 animate-fade-in-up">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
            <span className="text-2xl sm:text-3xl font-black tracking-wide text-white transition-transform hover:scale-105">
              WELCOME
            </span>

            <div className="hidden items-center gap-8 text-sm font-semibold lg:flex">
              <a href="#inicio" className="transition-colors hover:text-red-400">Inicio</a>
              <a href="#restaurantes" className="transition-colors hover:text-red-400">Nuestros Restaurantes</a>
              <a href="#ubicaciones" className="transition-colors hover:text-red-400">Testimonios</a>
              <a href="#nosotros" className="transition-colors hover:text-red-400">Nosotros</a>
            </div>

            <Link
              to="/auth"
              className="rounded-full border border-red-500/50 bg-red-600/20 px-5 py-2.5 text-xs sm:text-sm font-bold backdrop-blur-md transition-all hover:scale-105 hover:border-red-500 hover:bg-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              Iniciar sesión
            </Link>
          </nav>
        </header>

        <main id="inicio" className="relative z-20 flex min-h-[100vh] items-center justify-center px-4 text-center">
          <div>
            <h1 className="text-5xl font-black tracking-widest text-red-600 animate-pulse-glow sm:text-7xl animate-fade-in-up">
              WELCOME
            </h1>
            <p className="mt-4 text-xl font-light sm:text-4xl text-white/90 animate-fade-in-up-delay-1">¡Doblemente Delicioso!</p>
            
          </div>
        </main>
      </section>

      <section id="restaurantes" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl animate-fade-in-up">Nuestros Restaurantes</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {restaurantTypes.map((restaurant) => (
            <article
              key={restaurant.title}
              className={`group overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${restaurant.delayClass}`}
            >
              <div className="h-56 overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-6 text-zinc-800">
                <h3 className="text-xl font-bold transition-colors group-hover:text-red-600">{restaurant.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{restaurant.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ubicaciones" className="relative mt-10 min-h-[70vh] overflow-hidden">
        <img
          src={testimonialsBg}
          alt="Testimonios de clientes"
          className="absolute inset-0 h-full w-full object-cover scale-105 transition-transform duration-[20s] hover:scale-100"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-20 text-white sm:grid-cols-2 sm:px-8">
          <h2 className="sm:col-span-2 text-4xl font-black text-center mb-8 drop-shadow-lg">Testimonios</h2>
          {testimonials.map((item, i) => (
            <article key={item.name} className="max-w-xl rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/10 hover:-translate-y-1">
              <h3 className="text-2xl font-bold leading-tight text-red-400">{item.name}</h3>
              <p className="mt-3 text-sm leading-7 text-white/90 italic">"{item.message}"</p>
            </article>
          ))}
        </div>
      </section>

      <footer id="nosotros" className="bg-zinc-950 text-zinc-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:grid-cols-2 sm:px-8">
          <div>
            <h3 className="text-4xl font-black tracking-widest text-white bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent w-fit">Fuego y Sabor</h3>
            <p className="mt-6 max-w-xl text-sm leading-7 text-zinc-400">
              Para Restaurantes Fuego y Sabor compartir entre amigos o en familia es uno de los mejores placeres.
              Queremos que cada receta forme parte de tu historia.
            </p>
            <p className="mt-8 text-xs text-zinc-500 font-medium">© 2026 Copyrights · Fuego y Sabor Guatemala</p>
          </div>

          <div className="sm:justify-self-end">
            <h4 className="text-2xl font-bold text-white">Visítanos en el siguiente horario:</h4>
            <p className="mt-3 text-sm text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Lu - Do 10:00 a 22:00
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xl transition-all hover:border-red-500 hover:bg-red-500 hover:text-white cursor-pointer shadow-lg">f</span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xl transition-all hover:border-red-500 hover:bg-red-500 hover:text-white cursor-pointer shadow-lg">ig</span>
              <span className="inline-flex h-12 min-w-24 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-500 px-4 text-2xl font-black text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-transform hover:scale-105 cursor-pointer">
                1733
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
