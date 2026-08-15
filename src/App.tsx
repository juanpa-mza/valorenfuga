import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Coins,
  Landmark,
  AlertTriangle,
  Trophy,
  RotateCcw,
  ChevronRight,
  Banknote,
  Gem,
  Zap,
  Flame,
  Play,
  Home,
  Fuel,
  BarChart3,
} from 'lucide-react';
import { supabase } from './supabaseClient';
// ─────────────────────────────────────────────────────────
// BASE DE DATOS
// ─────────────────────────────────────────────────────────

// 50 billetes históricos. `real` = % de inflación acumulada estimada hasta hoy.
// Valores aproximados con fines educativos (muchos países redenominaron su
// moneda varias veces; se refleja el efecto acumulado total).
const FIAT_BILLS_CORE = [
  {
    id: 'ar-ley-1970',
    pais: 'Argentina',
    denominacion: '1 Peso Ley 18.188',
    periodo: '1970',
    contexto:
      'Pasó por 4 reconversiones monetarias hasta hoy (Ley, Argentino, Austral, Convertible).',
    fuente: 'BCRA — Series históricas',
    real: 900000000,
  },
  {
    id: 'ar-austral-1985',
    pais: 'Argentina',
    denominacion: '1 Austral',
    periodo: '1985',
    contexto: 'Reemplazó al Peso Argentino a razón de 1 a 1.000.',
    fuente: 'BCRA — Series históricas',
    real: 300000000,
  },
  {
    id: 'ar-austral-1988',
    pais: 'Argentina',
    denominacion: '1.000 Australes',
    periodo: '1988',
    contexto:
      'El Austral fue reemplazado en 1992: 10.000 australes = 1 peso convertible.',
    fuente: 'BCRA — Series históricas',
    real: 250000000,
  },
  {
    id: 'ar-convertible-1992',
    pais: 'Argentina',
    denominacion: '1 Peso Convertible',
    periodo: '1992',
    contexto:
      'Nació valiendo 1 USD. El fin de la convertibilidad en 2002 inició una nueva escalada de precios.',
    fuente: 'INDEC — IPC empalmado',
    real: 450000,
  },
  {
    id: 'ar-peso-2001',
    pais: 'Argentina',
    denominacion: '1 Peso',
    periodo: '2001',
    contexto: 'Último año de la paridad 1 a 1 con el dólar.',
    fuente: 'INDEC — IPC empalmado',
    real: 25000,
  },
  {
    id: 'ar-peso-2015',
    pais: 'Argentina',
    denominacion: '10 Pesos',
    periodo: '2015',
    contexto:
      'Billete todavía en circulación cuando empezó el nuevo ciclo inflacionario.',
    fuente: 'INDEC — IPC',
    real: 7000,
  },
  {
    id: 'br-cruzeiro-1970',
    pais: 'Brasil',
    denominacion: '1 Cruzeiro',
    periodo: '1970',
    contexto:
      'Brasil encadenó 4 monedas distintas hasta llegar al Real en 1994.',
    fuente: 'Banco Central do Brasil',
    real: 999999000,
  },
  {
    id: 'br-cruzado-1986',
    pais: 'Brasil',
    denominacion: '1.000 Cruzados',
    periodo: '1986',
    contexto:
      'Parte del Plan Cruzado, que intentó frenar la hiperinflación sin éxito.',
    fuente: 'Banco Central do Brasil',
    real: 500000000,
  },
  {
    id: 'br-cruzeiro-real-1993',
    pais: 'Brasil',
    denominacion: '1 Cruzeiro Real',
    periodo: '1993',
    contexto: 'Duró apenas un año antes de la llegada del Real en 1994.',
    fuente: 'Banco Central do Brasil',
    real: 2500000,
  },
  {
    id: 'br-real-1994',
    pais: 'Brasil',
    denominacion: '1 Real',
    periodo: '1994',
    contexto:
      'Nació como parte del exitoso Plan Real que domó la hiperinflación.',
    fuente: 'IBGE — IPCA',
    real: 950,
  },
  {
    id: 'de-marco-1922',
    pais: 'Alemania (Weimar)',
    denominacion: '1.000 Marcos',
    periodo: '1922',
    contexto:
      'Un año después, hacía falta una carretilla de billetes para comprar pan.',
    fuente: 'Reichsbank — Registro histórico',
    real: 99999999999,
  },
  {
    id: 'hu-pengo-1946',
    pais: 'Hungría',
    denominacion: '100 Pengő',
    periodo: '1946',
    contexto:
      'La hiperinflación más severa jamás registrada: los precios se duplicaban cada 15 horas.',
    fuente: 'Banco Nacional de Hungría',
    real: 99999999999,
  },
  {
    id: 'yu-dinar-1993',
    pais: 'Yugoslavia',
    denominacion: '1.000.000 Dinares',
    periodo: '1993',
    contexto: 'Se llegaron a imprimir billetes de 500.000 millones de dinares.',
    fuente: 'Banco Nacional de Yugoslavia',
    real: 999999000,
  },
  {
    id: 'zw-10-2006',
    pais: 'Zimbabue',
    denominacion: '10 Dólares',
    periodo: '2006',
    contexto: 'Apenas dos años antes del billete de 100 billones.',
    fuente: 'Reserve Bank of Zimbabwe',
    real: 99999000,
  },
  {
    id: 'zw-100t-2008',
    pais: 'Zimbabue',
    denominacion: '100 Trillion Dollars',
    periodo: '2008',
    contexto:
      'La inflación mensual llegó a ~79.600.000.000%. La moneda fue discontinuada.',
    fuente: 'Reserve Bank of Zimbabwe',
    real: 99999999,
  },
  {
    id: 've-bs-1998',
    pais: 'Venezuela',
    denominacion: '1.000 Bolívares',
    periodo: '1998',
    contexto:
      'Antes de las tres redenominaciones que vendrían después (2008, 2018, 2021).',
    fuente: 'BCV — Reconstrucción histórica',
    real: 99999500,
  },
  {
    id: 've-bsf-2008',
    pais: 'Venezuela',
    denominacion: '100 Bolívares Fuertes',
    periodo: '2008',
    contexto:
      'El Bolívar fue redenominado dos veces más, borrando hasta 14 ceros en total.',
    fuente: 'BCV — Reconstrucción histórica',
    real: 99999900,
  },
  {
    id: 'cl-escudo-1973',
    pais: 'Chile',
    denominacion: '10 Escudos',
    periodo: '1973',
    contexto:
      'El Escudo fue reemplazado por el Peso en 1975, a razón de 1.000 a 1.',
    fuente: 'Banco Central de Chile',
    real: 5000000,
  },
  {
    id: 'bo-peso-1985',
    pais: 'Bolivia',
    denominacion: '1.000.000 Pesos Bolivianos',
    periodo: '1985',
    contexto:
      'Una de las hiperinflaciones más rápidas de la historia. Nació el Boliviano en 1987 (1 a 1.000.000).',
    fuente: 'Banco Central de Bolivia',
    real: 99999000,
  },
  {
    id: 'pe-inti-1988',
    pais: 'Perú',
    denominacion: '1.000 Intis',
    periodo: '1988',
    contexto:
      'El Inti fue reemplazado por el Nuevo Sol en 1991, a razón de 1.000.000 a 1.',
    fuente: 'BCR del Perú',
    real: 99999000,
  },
  {
    id: 'mx-peso-1982',
    pais: 'México',
    denominacion: '1.000 Pesos',
    periodo: '1982',
    contexto: 'Año de la "década perdida" y la fuerte devaluación mexicana.',
    fuente: 'Banco de México',
    real: 450000,
  },
  {
    id: 'mx-peso-1994',
    pais: 'México',
    denominacion: '50 Nuevos Pesos',
    periodo: '1994',
    contexto: 'Año del "Efecto Tequila", crisis cambiaria mexicana.',
    fuente: 'Banco de México',
    real: 1200,
  },
  {
    id: 'tr-lira-2000',
    pais: 'Turquía',
    denominacion: '1.000.000 Liras',
    periodo: '2000',
    contexto: 'La Lira fue redenominada en 2005, quitando 6 ceros.',
    fuente: 'Banco Central de Turquía',
    real: 550000,
  },
  {
    id: 'tr-lira-2021',
    pais: 'Turquía',
    denominacion: '10 Liras',
    periodo: '2021',
    contexto: 'Inicio de la reciente crisis inflacionaria turca.',
    fuente: 'TÜİK — IPC',
    real: 2200,
  },
  {
    id: 'ru-rublo-1998',
    pais: 'Rusia',
    denominacion: '10 Rublos',
    periodo: '1998',
    contexto: 'Año del default ruso y devaluación abrupta del rublo.',
    fuente: 'Banco Central de Rusia',
    real: 8500,
  },
  {
    id: 'vn-dong-1985',
    pais: 'Vietnam',
    denominacion: '10 Dong',
    periodo: '1985',
    contexto:
      'Año de la reforma económica "Đổi Mới" tras años de alta inflación.',
    fuente: 'Banco Estatal de Vietnam',
    real: 950000,
  },
  {
    id: 'pl-zloty-1990',
    pais: 'Polonia',
    denominacion: '10.000 Zlotych',
    periodo: '1990',
    contexto: 'El Zloty fue redenominado en 1995, quitando 4 ceros.',
    fuente: 'Narodowy Bank Polski',
    real: 250000,
  },
  {
    id: 'ua-karbovanets-1994',
    pais: 'Ucrania',
    denominacion: '1.000 Karbovantsiv',
    periodo: '1994',
    contexto:
      'Moneda de transición reemplazada por la Grivna en 1996 (1 a 100.000).',
    fuente: 'Banco Nacional de Ucrania',
    real: 99999000,
  },
  {
    id: 'by-rublo-1994',
    pais: 'Bielorrusia',
    denominacion: '500 Rublos',
    periodo: '1994',
    contexto: 'Pasó por varias redenominaciones hasta el rublo actual.',
    fuente: 'Banco Nacional de Bielorrusia',
    real: 9999000,
  },
  {
    id: 'lb-libra-2019',
    pais: 'Líbano',
    denominacion: '10.000 Libras',
    periodo: '2019',
    contexto:
      'Desde la crisis de 2019, la libra libanesa perdió más del 98% de su valor.',
    fuente: 'Banco du Liban',
    real: 9800,
  },
  {
    id: 'sd-libra-2011',
    pais: 'Sudán',
    denominacion: '10 Libras',
    periodo: '2011',
    contexto:
      'Año de la partición de Sudán del Sur, con fuerte impacto económico.',
    fuente: 'Banco Central de Sudán',
    real: 55000,
  },
  {
    id: 'sy-libra-2011',
    pais: 'Siria',
    denominacion: '1.000 Libras',
    periodo: '2011',
    contexto:
      'Inicio de la guerra civil siria y colapso progresivo de la moneda.',
    fuente: 'Banco Central de Siria',
    real: 99000,
  },
  {
    id: 'ir-rial-1979',
    pais: 'Irán',
    denominacion: '1.000 Rials',
    periodo: '1979',
    contexto: 'Año de la Revolución Islámica.',
    fuente: 'Banco Central de Irán',
    real: 250000,
  },
  {
    id: 'ng-naira-1990',
    pais: 'Nigeria',
    denominacion: '10 Naira',
    periodo: '1990',
    contexto: 'Décadas de alta inflación estructural en la economía nigeriana.',
    fuente: 'Banco Central de Nigeria',
    real: 45000,
  },
  {
    id: 'gh-cedi-1983',
    pais: 'Ghana',
    denominacion: '50 Cedis',
    periodo: '1983',
    contexto: 'El Cedi fue redenominado en 2007, quitando 4 ceros.',
    fuente: 'Banco de Ghana',
    real: 99999000,
  },
  {
    id: 'ao-kwanza-1995',
    pais: 'Angola',
    denominacion: '1.000 Kwanzas',
    periodo: '1995',
    contexto: 'Angola redenominó su moneda varias veces durante los 90.',
    fuente: 'Banco Nacional de Angola',
    real: 99999000,
  },
  {
    id: 'zm-kwacha-1992',
    pais: 'Zambia',
    denominacion: '500 Kwacha',
    periodo: '1992',
    contexto: 'Década de fuerte inestabilidad monetaria en Zambia.',
    fuente: 'Banco de Zambia',
    real: 250000,
  },
  {
    id: 'cd-zaire-1993',
    pais: 'R.D. Congo',
    denominacion: '5.000.000 Zaires',
    periodo: '1993',
    contexto: 'El Zaire fue reemplazado por el Franco Congoleño en 1997.',
    fuente: 'Banco Central del Congo',
    real: 99999000,
  },
  {
    id: 'bg-lev-1996',
    pais: 'Bulgaria',
    denominacion: '1.000 Leva',
    periodo: '1996',
    contexto: 'El Lev fue redenominado en 1999, quitando 3 ceros.',
    fuente: 'Banco Nacional de Bulgaria',
    real: 999000,
  },
  {
    id: 'ro-leu-2000',
    pais: 'Rumania',
    denominacion: '10.000 Lei',
    periodo: '2000',
    contexto: 'El Leu fue redenominado en 2005, quitando 4 ceros.',
    fuente: 'Banca Națională a României',
    real: 45000,
  },
  {
    id: 'il-shekel-1984',
    pais: 'Israel',
    denominacion: '1.000 Shekalim',
    periodo: '1984',
    contexto: 'Redenominado en 1985 (1.000 a 1) al lanzar el Nuevo Shekel.',
    fuente: 'Banco de Israel',
    real: 99999000,
  },
  {
    id: 'ba-dinar-1993',
    pais: 'Bosnia',
    denominacion: '1.000.000.000 Dinares',
    periodo: '1993',
    contexto: 'Hiperinflación durante la guerra de los Balcanes.',
    fuente: 'Registro histórico regional',
    real: 999999000,
  },
  {
    id: 'ge-cupon-1994',
    pais: 'Georgia',
    denominacion: '1.000.000 Kuponi',
    periodo: '1994',
    contexto:
      'Moneda de transición reemplazada por el Lari en 1995 (1 a 1.000.000).',
    fuente: 'Banco Nacional de Georgia',
    real: 99999000,
  },
  {
    id: 'am-rublo-1993',
    pais: 'Armenia',
    denominacion: '50 Rublos',
    periodo: '1993',
    contexto: 'Año de introducción del Dram armenio como moneda de transición.',
    fuente: 'Banco Central de Armenia',
    real: 500000,
  },
  {
    id: 'us-dollar-1913',
    pais: 'Estados Unidos',
    denominacion: '1 Dólar',
    periodo: '1913',
    contexto: 'Año de creación de la Reserva Federal.',
    fuente: 'U.S. Bureau of Labor Statistics — CPI',
    real: 3200,
  },
  {
    id: 'us-dollar-1971',
    pais: 'Estados Unidos',
    denominacion: '1 Dólar',
    periodo: '1971',
    contexto: 'Año del "Nixon Shock": el dólar dejó de ser convertible a oro.',
    fuente: 'U.S. Bureau of Labor Statistics — CPI',
    real: 680,
  },
  {
    id: 'gb-libra-1971',
    pais: 'Reino Unido',
    denominacion: '1 Libra',
    periodo: '1971',
    contexto: 'Año de la decimalización de la libra esterlina.',
    fuente: 'Office for National Statistics — CPI',
    real: 1450,
  },
  {
    id: 'jp-yen-1946',
    pais: 'Japón',
    denominacion: '10 Yenes',
    periodo: '1946',
    contexto: 'Reforma monetaria de posguerra tras fuerte inflación.',
    fuente: 'Banco de Japón',
    real: 25000,
  },
  {
    id: 'id-rupiah-1998',
    pais: 'Indonesia',
    denominacion: '10.000 Rupias',
    periodo: '1998',
    contexto: 'Año de la Crisis Financiera Asiática.',
    fuente: 'Bank Indonesia',
    real: 850,
  },
  {
    id: 'gr-dracma-1944',
    pais: 'Grecia',
    denominacion: '50.000 Dracmas',
    periodo: '1944',
    contexto:
      'Una de las hiperinflaciones más severas registradas, durante la ocupación.',
    fuente: 'Banco de Grecia',
    real: 99999999,
  },
];

// 50 activos financieros. `real` = valor final en USD de $100 invertidos en ese año.
// Valores aproximados con fines educativos (algunos activos incluso perdieron
// valor real: la lección es el promedio, no una garantía individual).
const ASSETS_CORE = [
  {
    id: 'btc-2011',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2011',
    contexto: 'Cuando casi nadie sabía qué era Bitcoin.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 6500000,
  },
  {
    id: 'btc-2013',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2013',
    contexto: 'Comprado antes del primer gran ciclo alcista de BTC.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 65000,
  },
  {
    id: 'btc-2015',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2015',
    contexto: 'Año de mercado bajista tras el primer gran boom.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 22000,
  },
  {
    id: 'btc-2017',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2017',
    contexto: 'Año de la primera gran "fiebre" cripto mundial.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 2200,
  },
  {
    id: 'btc-2019',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2019',
    contexto: 'Año de recuperación tras el "invierno cripto" 2018.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 1600,
  },
  {
    id: 'btc-2021',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2021',
    contexto:
      'Comprado cerca de un máximo histórico, antes del "invierno cripto" 2022.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 220,
  },
  {
    id: 'btc-2022',
    nombre: 'Bitcoin',
    categoria: 'Cripto',
    periodo: '2022',
    contexto: 'Comprado durante el colapso de FTX y el mercado bajista.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 325,
  },
  {
    id: 'eth-2016',
    nombre: 'Ethereum',
    categoria: 'Cripto',
    periodo: '2016',
    contexto: 'Poco después del lanzamiento de la red Ethereum.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 29000,
  },
  {
    id: 'eth-2018',
    nombre: 'Ethereum',
    categoria: 'Cripto',
    periodo: '2018',
    contexto: 'Comprado tras la corrección post-boom de ICOs.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 800,
  },
  {
    id: 'eth-2020',
    nombre: 'Ethereum',
    categoria: 'Cripto',
    periodo: '2020',
    contexto: 'Justo antes del boom de DeFi y NFTs.',
    fuente: 'Cotización histórica spot (aprox.)',
    real: 2460,
  },
  {
    id: 'aapl-1990',
    nombre: 'Apple',
    categoria: 'Acciones',
    periodo: '1990',
    contexto: 'Años antes del regreso de Steve Jobs y el iPhone.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 95000,
  },
  {
    id: 'aapl-2000',
    nombre: 'Apple',
    categoria: 'Acciones',
    periodo: '2000',
    contexto: 'Recién relanzada tras el iMac, antes del iPod y el iPhone.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 45000,
  },
  {
    id: 'aapl-2010',
    nombre: 'Apple',
    categoria: 'Acciones',
    periodo: '2010',
    contexto: 'Año del lanzamiento del primer iPad.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 2200,
  },
  {
    id: 'aapl-2015',
    nombre: 'Apple',
    categoria: 'Acciones',
    periodo: '2015',
    contexto: 'Ya era una de las empresas más valiosas del mundo.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 650,
  },
  {
    id: 'amzn-1997',
    nombre: 'Amazon',
    categoria: 'Acciones',
    periodo: '1997',
    contexto:
      'Año de su Oferta Pública Inicial (IPO), cuando solo vendía libros.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 180000,
  },
  {
    id: 'amzn-2001',
    nombre: 'Amazon',
    categoria: 'Acciones',
    periodo: '2001',
    contexto: 'Comprada tras el estallido de la burbuja "puntocom".',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 35000,
  },
  {
    id: 'amzn-2010',
    nombre: 'Amazon',
    categoria: 'Acciones',
    periodo: '2010',
    contexto: 'Años antes de la consolidación de AWS como negocio clave.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 3800,
  },
  {
    id: 'msft-1990',
    nombre: 'Microsoft',
    categoria: 'Acciones',
    periodo: '1990',
    contexto: 'Año del lanzamiento de Windows 3.0.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 65000,
  },
  {
    id: 'msft-2000',
    nombre: 'Microsoft',
    categoria: 'Acciones',
    periodo: '2000',
    contexto: 'En la cima de la burbuja puntocom.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 1400,
  },
  {
    id: 'googl-2004',
    nombre: 'Google',
    categoria: 'Acciones',
    periodo: '2004',
    contexto: 'Año de su Oferta Pública Inicial (IPO).',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 4200,
  },
  {
    id: 'nflx-2005',
    nombre: 'Netflix',
    categoria: 'Acciones',
    periodo: '2005',
    contexto: 'Cuando todavía enviaba DVDs por correo.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 8500,
  },
  {
    id: 'nflx-2012',
    nombre: 'Netflix',
    categoria: 'Acciones',
    periodo: '2012',
    contexto: 'Justo antes de su gran apuesta por el streaming original.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 4200,
  },
  {
    id: 'tsla-2012',
    nombre: 'Tesla',
    categoria: 'Acciones',
    periodo: '2012',
    contexto: 'Año del lanzamiento del Model S.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 18000,
  },
  {
    id: 'tsla-2019',
    nombre: 'Tesla',
    categoria: 'Acciones',
    periodo: '2019',
    contexto: 'Antes de su inclusión en el índice S&P 500.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 2200,
  },
  {
    id: 'nvda-2015',
    nombre: 'Nvidia',
    categoria: 'Acciones',
    periodo: '2015',
    contexto: 'Años antes del boom de la inteligencia artificial.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 28000,
  },
  {
    id: 'nvda-2019',
    nombre: 'Nvidia',
    categoria: 'Acciones',
    periodo: '2019',
    contexto: 'Justo antes del despegue de la demanda por IA generativa.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 4500,
  },
  {
    id: 'nvda-2020',
    nombre: 'Nvidia',
    categoria: 'Acciones',
    periodo: '2020',
    contexto: 'En plena pandemia, antes del boom de IA.',
    fuente: 'Precio ajustado por splits (aprox.)',
    real: 1800,
  },
  {
    id: 'brk-1980',
    nombre: 'Berkshire Hathaway',
    categoria: 'Acciones',
    periodo: '1980',
    contexto: 'Años del ascenso silencioso de Warren Buffett.',
    fuente: 'Precio histórico (aprox.)',
    real: 120000,
  },
  {
    id: 'brk-2000',
    nombre: 'Berkshire Hathaway',
    categoria: 'Acciones',
    periodo: '2000',
    contexto: 'Ya consolidada como uno de los mayores holdings del mundo.',
    fuente: 'Precio histórico (aprox.)',
    real: 800,
  },
  {
    id: 'sp500-1980',
    nombre: 'S&P 500',
    categoria: 'Índice',
    periodo: '1980',
    contexto: 'Comprado al índice completo del mercado accionario de EE.UU.',
    fuente: 'Índice S&P 500, precio (aprox., sin dividendos)',
    real: 6500,
  },
  {
    id: 'sp500-1990',
    nombre: 'S&P 500',
    categoria: 'Índice',
    periodo: '1990',
    contexto: 'Comprado al índice completo del mercado accionario de EE.UU.',
    fuente: 'Índice S&P 500, precio (aprox., sin dividendos)',
    real: 1900,
  },
  {
    id: 'sp500-2000',
    nombre: 'S&P 500',
    categoria: 'Índice',
    periodo: '2000',
    contexto: 'Comprado en la cima de la burbuja "puntocom".',
    fuente: 'Índice S&P 500, precio (aprox., sin dividendos)',
    real: 410,
  },
  {
    id: 'sp500-2008',
    nombre: 'S&P 500',
    categoria: 'Índice',
    periodo: '2008',
    contexto: 'Comprado cerca del piso de la Crisis Financiera Global.',
    fuente: 'Índice S&P 500, precio (aprox., sin dividendos)',
    real: 670,
  },
  {
    id: 'sp500-2020',
    nombre: 'S&P 500',
    categoria: 'Índice',
    periodo: '2020',
    contexto: 'Comprado tras el shock inicial de la pandemia.',
    fuente: 'Índice S&P 500, precio (aprox., sin dividendos)',
    real: 250,
  },
  {
    id: 'nasdaq-2000',
    nombre: 'Nasdaq',
    categoria: 'Índice',
    periodo: '2000',
    contexto: 'En la cima de la burbuja "puntocom", justo antes del desplome.',
    fuente: 'Índice Nasdaq Composite (aprox.)',
    real: 340,
  },
  {
    id: 'nasdaq-2009',
    nombre: 'Nasdaq',
    categoria: 'Índice',
    periodo: '2009',
    contexto: 'Comprado cerca del piso de la Crisis Financiera Global.',
    fuente: 'Índice Nasdaq Composite (aprox.)',
    real: 950,
  },
  {
    id: 'nikkei-1989',
    nombre: 'Nikkei 225',
    categoria: 'Índice',
    periodo: '1989',
    contexto:
      'La cima de la burbuja japonesa: el índice tardó más de 30 años en recuperar ese nivel.',
    fuente: 'Índice Nikkei 225 (aprox.)',
    real: 85,
  },
  {
    id: 'oro-1971',
    nombre: 'Oro',
    categoria: 'Metal',
    periodo: '1971',
    contexto: 'El mismo año en que el dólar dejó el patrón oro.',
    fuente: 'Precio spot histórico del oro (aprox.)',
    real: 7100,
  },
  {
    id: 'oro-1980',
    nombre: 'Oro',
    categoria: 'Metal',
    periodo: '1980',
    contexto:
      'Comprado en el pico especulativo de 1980; tardó décadas en superarlo en términos nominales.',
    fuente: 'Precio spot histórico del oro (aprox.)',
    real: 290,
  },
  {
    id: 'oro-2000',
    nombre: 'Oro',
    categoria: 'Metal',
    periodo: '2000',
    contexto: 'Comprado antes del gran ciclo alcista de los 2000.',
    fuente: 'Precio spot histórico del oro (aprox.)',
    real: 850,
  },
  {
    id: 'oro-2008',
    nombre: 'Oro',
    categoria: 'Metal',
    periodo: '2008',
    contexto: 'Comprado en plena Crisis Financiera Global.',
    fuente: 'Precio spot histórico del oro (aprox.)',
    real: 260,
  },
  {
    id: 'plata-1980',
    nombre: 'Plata',
    categoria: 'Metal',
    periodo: '1980',
    contexto: 'Comprada en el pico especulativo de los hermanos Hunt.',
    fuente: 'Precio spot histórico de la plata (aprox.)',
    real: 90,
  },
  {
    id: 'plata-2000',
    nombre: 'Plata',
    categoria: 'Metal',
    periodo: '2000',
    contexto: 'Comprada antes del gran ciclo alcista de las materias primas.',
    fuente: 'Precio spot histórico de la plata (aprox.)',
    real: 480,
  },
  {
    id: 'petroleo-1998',
    nombre: 'Petróleo (WTI)',
    categoria: 'Commodity',
    periodo: '1998',
    contexto: 'Comprado en un mínimo histórico, antes del boom de los 2000.',
    fuente: 'Precio spot WTI (aprox.)',
    real: 520,
  },
  {
    id: 'petroleo-2008',
    nombre: 'Petróleo (WTI)',
    categoria: 'Commodity',
    periodo: '2008',
    contexto:
      'Comprado en el pico de $147 el barril, justo antes del desplome.',
    fuente: 'Precio spot WTI (aprox.)',
    real: 65,
  },
  {
    id: 'petroleo-2020',
    nombre: 'Petróleo (WTI)',
    categoria: 'Commodity',
    periodo: '2020',
    contexto:
      'El año en que los precios llegaron a ser negativos por un shock de demanda.',
    fuente: 'Precio spot WTI (aprox.)',
    real: 260,
  },
  {
    id: 'cobre-2000',
    nombre: 'Cobre',
    categoria: 'Commodity',
    periodo: '2000',
    contexto:
      'Comprado antes del "superciclo" de las materias primas impulsado por China.',
    fuente: 'Precio spot histórico (aprox.)',
    real: 480,
  },
  {
    id: 'inmobiliario-1970',
    nombre: 'Vivienda promedio (EE.UU.)',
    categoria: 'Inmobiliario',
    periodo: '1970',
    contexto: 'Índice de precios de vivienda residencial en EE.UU.',
    fuente: 'Índice de precios inmobiliarios (aprox.)',
    real: 2400,
  },
  {
    id: 'inmobiliario-2000',
    nombre: 'Vivienda promedio (EE.UU.)',
    categoria: 'Inmobiliario',
    periodo: '2000',
    contexto: 'Comprada antes de la burbuja inmobiliaria de los 2000.',
    fuente: 'Índice de precios inmobiliarios (aprox.)',
    real: 320,
  },
  {
    id: 'bonos10y-1980',
    nombre: 'Bono del Tesoro (10 años)',
    categoria: 'Bonos',
    periodo: '1980',
    contexto: 'Comprado con tasas de interés históricamente altísimas (~15%).',
    fuente: 'Rendimiento histórico compuesto (aprox.)',
    real: 950,
  },
];

// ── Generador de variantes ──────────────────────────────
// A partir de las 50 monedas y los 50 activos "base" de arriba, se generan
// 5 variantes cada uno (otros años, con el valor real reescalado en base a
// la trayectoria histórica típica de ese caso), sumando 500 situaciones
// nuevas. Todo queda etiquetado igual como aproximado/educativo.

const clampYear = (y) => Math.max(1900, Math.min(2025, y));

const FIAT_YEAR_OFFSETS = [-10, -5, -2, 3, 8];
const FIAT_MULTIPLIERS = [0.05, 0.25, 0.55, 1.8, 3.2];
const DENOM_POOL = [
  '1',
  '5',
  '10',
  '20',
  '50',
  '100',
  '500',
  '1.000',
  '5.000',
  '10.000',
];

function generateFiatVariants(core) {
  const extra = [];
  core.forEach((b, idx) => {
    const anchorYear = parseInt(b.periodo, 10) || 2000;
    const monedaTexto = b.denominacion.split(' ').slice(1).join(' ');
    FIAT_YEAR_OFFSETS.forEach((offset, i) => {
      const year = clampYear(anchorYear + offset);
      if (year === anchorYear) return;
      const real = Math.min(
        999999999999,
        Math.max(5, Math.round(b.real * FIAT_MULTIPLIERS[i]))
      );
      const denom = DENOM_POOL[(idx + i) % DENOM_POOL.length];
      extra.push({
        id: `${b.id}-v${i}`,
        pais: b.pais,
        denominacion: `${denom} ${monedaTexto}`,
        periodo: String(year),
        contexto: b.contexto,
        fuente: b.fuente,
        real,
      });
    });
  });
  return extra;
}

const ASSET_YEAR_OFFSETS = [-8, -4, -2, 3, 6];
const ASSET_MULTIPLIERS = [0.35, 0.65, 1.3, 0.75, 1.9];

function generateAssetVariants(core) {
  const extra = [];
  core.forEach((a, idx) => {
    const anchorYear = parseInt(a.periodo, 10) || 2010;
    ASSET_YEAR_OFFSETS.forEach((offset, i) => {
      const year = clampYear(anchorYear + offset);
      if (year === anchorYear) return;
      const real = Math.max(5, Math.round(a.real * ASSET_MULTIPLIERS[i]));
      extra.push({
        id: `${a.id}-v${i}`,
        nombre: a.nombre,
        categoria: a.categoria,
        periodo: String(year),
        contexto: a.contexto,
        fuente: a.fuente,
        real,
      });
    });
  });
  return extra;
}

const FIAT_BILLS = [
  ...FIAT_BILLS_CORE,
  ...generateFiatVariants(FIAT_BILLS_CORE),
];
const ASSETS = [...ASSETS_CORE, ...generateAssetVariants(ASSETS_CORE)];

const ROUND_SECONDS = 20;

// ─────────────────────────────────────────────────────────
// LÓGICA DE PUNTAJE
// ─────────────────────────────────────────────────────────

function calcScore(userVal, real, timedOut) {
  if (timedOut || !isFinite(userVal) || userVal <= 0) return 0;
  const errorPct = (Math.abs(userVal - real) / real) * 100;
  let score;
  if (errorPct <= 1) score = 100;
  else if (errorPct <= 10) score = 100 - errorPct * 2.2;
  else if (errorPct <= 25) score = 80 - (errorPct - 10) * 2;
  else if (errorPct <= 50) score = 50 - (errorPct - 25) * 1;
  else if (errorPct <= 100) score = 25 - (errorPct - 50) * 0.4;
  else score = 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(n) {
  if (n >= 1000000)
    return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

// Formatea lo que el usuario va tipeando: punto cada 3 cifras, coma para
// decimales (convención es-AR) — así "1.000.000" nunca se confunde con "100.000".
function formatNumberInput(raw) {
  let cleaned = raw.replace(/[^\d,]/g, '');
  const firstComma = cleaned.indexOf(',');
  if (firstComma !== -1) {
    cleaned =
      cleaned.slice(0, firstComma + 1) +
      cleaned.slice(firstComma + 1).replace(/,/g, '');
  }
  const [intRaw, decPart] = cleaned.split(',');
  const intPart = (intRaw || '').replace(/^0+(\d)/, '$1');
  const withDots = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  return decPart !== undefined
    ? `${withDots},${decPart.slice(0, 2)}`
    : withDots;
}

// Convierte el texto formateado ("1.500.000,5") de vuelta a número.
function parseUserNumber(str) {
  if (!str) return NaN;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// ─────────────────────────────────────────────────────────
// UI: ANILLO DE TIEMPO
// ─────────────────────────────────────────────────────────

function TimerRing({ timeLeft, mode }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, timeLeft / ROUND_SECONDS);
  const offset = circ * (1 - pct);
  const critical = timeLeft <= 3;
  const ringColor = critical
    ? 'stroke-red-500'
    : mode === 'fiat'
    ? 'stroke-rose-400'
    : 'stroke-emerald-400';
  const textColor = critical
    ? 'text-red-500'
    : mode === 'fiat'
    ? 'text-rose-300'
    : 'text-emerald-300';

  return (
    <div
      className={`relative w-24 h-24 shrink-0 ${
        critical ? 'animate-pulse' : ''
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          strokeWidth="7"
          className="stroke-slate-800"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          strokeWidth="7"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${ringColor} transition-[stroke-dashoffset] duration-100 ease-linear`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-2xl font-bold tabular-nums ${textColor}`}
        >
          {timeLeft.toFixed(1)}
        </span>
        <Clock className={`w-3 h-3 ${textColor} opacity-70`} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// UI: TARJETA DE BILLETE (Modalidad FIAT) — se "degrada" con el tiempo
// ─────────────────────────────────────────────────────────

function FiatCard({ round, timeLeft }) {
  const decay = 1 - timeLeft / ROUND_SECONDS; // 0 → 1
  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl border-2 border-dashed border-amber-200/40 p-6 bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 shadow-lg select-none"
      style={{
        filter: `grayscale(${decay * 85}%) brightness(${
          1 - decay * 0.35
        }) contrast(${1 - decay * 0.15})`,
        transform: `scale(${1 - decay * 0.04})`,
        transition: 'filter 100ms linear, transform 100ms linear',
      }}
    >
      <div className="absolute top-3 left-3 text-amber-900/60 text-[10px] font-mono tracking-widest uppercase">
        Billete histórico
      </div>
      <div className="absolute top-3 right-3">
        <Banknote className="w-6 h-6 text-amber-900/50" />
      </div>
      <div className="mt-6 text-center">
        <div className="text-amber-900/70 text-sm font-semibold tracking-wide uppercase">
          {round.pais}
        </div>
        <div className="text-3xl sm:text-4xl font-black text-amber-950 my-2 tracking-tight">
          {round.denominacion}
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-amber-900/10 text-amber-900 font-mono text-sm font-bold">
          Emitido en {round.periodo}
        </div>
      </div>
      <div className="mt-4 border-t border-amber-900/20 pt-3 text-[11px] text-amber-900/70 text-center leading-snug">
        {round.contexto}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// UI: TARJETA DE ACTIVO (Modalidad Activos)
// ─────────────────────────────────────────────────────────

const ASSET_ICON = {
  Cripto: Zap,
  Acciones: TrendingUp,
  Metal: Gem,
  Índice: BarChart3,
  Commodity: Fuel,
  Inmobiliario: Home,
  Bonos: Landmark,
};

function AssetCard({ round, timeLeft }) {
  const Icon = ASSET_ICON[round.categoria] || Coins;
  const grow = 1 - timeLeft / ROUND_SECONDS;
  return (
    <div className="relative w-full max-w-sm mx-auto rounded-2xl border border-emerald-400/30 p-6 bg-slate-900 shadow-lg shadow-emerald-500/5 select-none">
      <div className="absolute top-3 left-3 text-emerald-400/60 text-[10px] font-mono tracking-widest uppercase">
        Activo financiero
      </div>
      <div
        className="absolute top-3 right-3 text-emerald-400"
        style={{
          opacity: 0.4 + grow * 0.6,
          transform: `scale(${1 + grow * 0.25})`,
          transition: '100ms linear',
        }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="mt-6 text-center">
        <div className="text-emerald-400/80 text-sm font-semibold tracking-wide uppercase">
          {round.categoria}
        </div>
        <div className="text-3xl sm:text-4xl font-black text-white my-2 tracking-tight">
          {round.nombre}
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 font-mono text-sm font-bold">
          Comprado en {round.periodo}
        </div>
      </div>
      <div className="mt-4 border-t border-slate-700 pt-3 text-[11px] text-slate-400 text-center leading-snug">
        {round.contexto}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('start'); // start | play | reveal | end
  const [rounds, setRounds] = useState([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);
  const advanceRef = useRef(null);
  const inputRef = useRef(null);
  const [nick, setNick] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('ranking_valorenfuga')
      .select('nick,score')
      .order('score', { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  };

  const saveScore = async () => {
    if (!nick.trim() || saving || saved) return;
    setSaving(true);
    const { error } = await supabase
      .from('ranking_valorenfuga')
      .insert({ nick: nick.trim().slice(0, 20), score: totalScore });
    setSaving(false);
    if (!error) {
      setSaved(true);
      fetchLeaderboard();
    }
  };

  useEffect(() => {
    if (screen === 'end') fetchLeaderboard();
  }, [screen]);
  const buildRounds = () =>
    shuffle([
      ...shuffle(FIAT_BILLS)
        .slice(0, 5)
        .map((b) => ({ ...b, type: 'fiat' })),
      ...shuffle(ASSETS)
        .slice(0, 5)
        .map((a) => ({ ...a, type: 'asset' })),
    ]);

    const startGame = () => {
      setRounds(buildRounds());
      setRoundIdx(0);
      setHistory([]);
      setInput('');
      setTimeLeft(ROUND_SECONDS);
      setNick('');
      setSaved(false);
      setLeaderboard([]);
      setScreen('play');
    };


  const submitAnswer = useCallback(
    (timedOut) => {
      clearInterval(intervalRef.current);
      setScreen((prev) => {
        if (prev !== 'play') return prev; // evita doble submit
        return 'reveal';
      });
      const round = rounds[roundIdx];
      if (!round) return;
      const raw = timedOut ? 0 : parseUserNumber(input);
      const userVal = isNaN(raw) ? 0 : raw;
      const score = calcScore(userVal, round.real, timedOut);
      setHistory((h) => [...h, { ...round, userVal, score, timedOut }]);
      advanceRef.current = setTimeout(() => nextRound(), 2400);
    },
    [rounds, roundIdx, input]
  );

  const nextRound = () => {
    clearTimeout(advanceRef.current);
    setRoundIdx((i) => {
      const next = i + 1;
      if (next >= 10) {
        setScreen('end');
        return i;
      }
      setInput('');
      setTimeLeft(ROUND_SECONDS);
      setScreen('play');
      return next;
    });
  };

  // Timer
  useEffect(() => {
    if (screen !== 'play') return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const nt = Math.max(0, +(t - 0.1).toFixed(1));
        if (nt <= 0) {
          clearInterval(intervalRef.current);
          submitAnswer(true);
        }
        return nt;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, roundIdx]);

  useEffect(() => {
    if (screen === 'play' && inputRef.current) inputRef.current.focus();
  }, [screen, roundIdx]);

  useEffect(
    () => () => {
      clearInterval(intervalRef.current);
      clearTimeout(advanceRef.current);
    },
    []
  );

  const totalScore = history.reduce((s, h) => s + h.score, 0);
  const currentRound = rounds[roundIdx];
  const lastResult = history[history.length - 1];

  const rating = (() => {
    if (totalScore >= 850)
      return {
        label: 'Genio Anti-Inflación',
        icon: Trophy,
        color: 'text-amber-400',
      };
    if (totalScore >= 600)
      return {
        label: 'Inversor con Ojo de Halcón',
        icon: TrendingUp,
        color: 'text-emerald-400',
      };
    if (totalScore >= 350)
      return { label: 'Aprendiz de Valor', icon: Coins, color: 'text-sky-400' };
    return {
      label: 'Necesitás Cobertura Urgente',
      icon: AlertTriangle,
      color: 'text-rose-400',
    };
  })();

  const fiatHistory = history.filter((h) => h.type === 'fiat');
  const assetHistory = history.filter((h) => h.type === 'asset');
  const avgInflacion = fiatHistory.length
    ? fiatHistory.reduce((s, h) => s + h.real, 0) / fiatHistory.length
    : 0;
  const avgMultiplicador = assetHistory.length
    ? assetHistory.reduce((s, h) => s + h.real, 0) / assetHistory.length / 100
    : 0;

  // ── PANTALLA: INICIO ─────────────────────────────────
  if (screen === 'start') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingDown className="w-8 h-8 text-rose-400" />
            <span className="text-slate-600 font-mono text-lg">vs</span>
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
            VALOR<span className="text-rose-400">EN</span>FUGA
          </h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            10 rondas al azar sobre un total de 600 situaciones reales. 20
            segundos por ronda.
            <br />
            Estimá cuánto valor perdió el papel moneda y cuánto ganaron los
            activos reales.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <Landmark className="w-5 h-5 text-rose-400 mb-2" />
              <div className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                Modo FIAT
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Estimá la inflación acumulada del billete.
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <Coins className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                Modo Activos
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Estimá cuánto valdrían hoy $100 invertidos.
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 font-bold text-lg py-4 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition"
          >
            <Play className="w-5 h-5" fill="currentColor" /> Empezar partida
          </button>
        </div>
      </div>
    );
  }

  // ── PANTALLA: FINAL ──────────────────────────────────
  if (screen === 'end') {
    const RatingIcon = rating.icon;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Puntaje final
            </div>
            <div className="text-6xl font-black font-mono tracking-tighter">
              {totalScore}
              <span className="text-2xl text-slate-600">/1000</span>
            </div>
            <div
              className={`flex items-center justify-center gap-2 mt-3 font-bold ${rating.color}`}
            >
              <RatingIcon className="w-5 h-5" /> {rating.label}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 mb-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-3 text-sm uppercase tracking-wide">
              <Flame className="w-4 h-4 text-amber-400" /> La lección, en
              números
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
                <div className="text-[11px] text-rose-300/80 uppercase font-semibold">
                  Papel moneda
                </div>
                <div className="text-xl font-black text-rose-300 font-mono">
                  +{fmt(avgInflacion)}%
                </div>
                <div className="text-[11px] text-slate-500">
                  inflación promedio acumulada jugada
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="text-[11px] text-emerald-300/80 uppercase font-semibold">
                  Activos reales
                </div>
                <div className="text-xl font-black text-emerald-300 font-mono">
                  x{fmt(avgMultiplicador)}
                </div>
                <div className="text-[11px] text-slate-500">
                  multiplicador promedio de $100 jugado
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              El dinero FIAT no es una reserva de valor: pierde poder de compra
              por diseño, todos los años. Los activos escasos o productivos
              (acciones, oro, bienes raíces, cripto) históricamente absorbieron
              ese desgaste y lo superaron. Valores del juego son aproximados,
              con fines educativos.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 mb-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-3 text-sm uppercase tracking-wide">
              <Trophy className="w-4 h-4 text-amber-400" /> Ranking global
            </div>
            {!saved ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={20}
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="Tu nick"
                  className="flex-1 bg-slate-800 border-2 border-slate-700 focus:border-white outline-none rounded-xl px-4 py-2 text-sm font-mono text-center placeholder:text-slate-600"
                />
                <button
                  onClick={saveScore}
                  disabled={!nick.trim() || saving}
                  className="bg-white text-slate-950 font-bold px-4 rounded-xl hover:bg-slate-200 active:scale-95 transition disabled:opacity-40"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : (
              <p className="text-emerald-400 text-sm text-center font-bold">¡Puntaje guardado, {nick}!</p>
            )}
            {leaderboard.length > 0 && (
              <div className="mt-4 space-y-1">
                {leaderboard.map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-800 last:border-0">
                    <span className="text-slate-400">
                      <span className="text-slate-600 font-mono mr-2">#{i + 1}</span>
                      {row.nick}
                    </span>
                    <span className="font-mono font-bold text-amber-300">{row.score} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 mb-6 max-h-48 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 text-xs border-b border-slate-800 last:border-0"
              >
                <span className="text-slate-400 truncate pr-2">
                  {h.type === 'fiat'
                    ? `${h.pais} ${h.periodo}`
                    : `${h.nombre} ${h.periodo}`}
                </span>
                <span
                  className={`font-mono font-bold ${
                    h.score >= 60
                      ? 'text-emerald-400'
                      : h.score > 0
                      ? 'text-amber-400'
                      : 'text-rose-500'
                  }`}
                >
                  {h.score} pts
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 font-bold text-lg py-4 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition"
          >
            <RotateCcw className="w-5 h-5" /> Jugar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── PANTALLA: JUGANDO / REVELACIÓN ───────────────────
  if (!currentRound) return null;
  const isFiat = currentRound.type === 'fiat';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">RONDA</span>
          <span className="font-mono font-bold text-lg">{roundIdx + 1}/10</span>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
            isFiat
              ? 'bg-rose-500/15 text-rose-300'
              : 'bg-emerald-500/15 text-emerald-300'
          }`}
        >
          {isFiat ? (
            <Landmark className="w-3.5 h-3.5" />
          ) : (
            <Coins className="w-3.5 h-3.5" />
          )}
          {isFiat ? 'Modo FIAT' : 'Modo Activo'}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full max-w-md flex gap-1 mb-6">
        {rounds.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < roundIdx
                ? 'bg-slate-500'
                : i === roundIdx
                ? 'bg-white'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="mb-6">
        <TimerRing timeLeft={timeLeft} mode={currentRound.type} />
      </div>

      {/* Tarjeta */}
      {isFiat ? (
        <FiatCard round={currentRound} timeLeft={timeLeft} />
      ) : (
        <AssetCard round={currentRound} timeLeft={timeLeft} />
      )}

      {/* Pregunta + input */}
      {screen === 'play' && (
        <div className="w-full max-w-sm mt-6">
          <p className="text-center text-sm text-slate-300 mb-3 font-medium">
            {isFiat
              ? '¿Qué % de inflación acumulada tiene este billete hasta hoy?'
              : '¿Cuántos USD tendrías hoy si hubieras comprado $100 en ese momento?'}
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={input}
                onChange={(e) => setInput(formatNumberInput(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && submitAnswer(false)}
                placeholder={isFiat ? 'ej: 45.000' : 'ej: 6.500.000'}
                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-white outline-none rounded-xl px-4 py-3 text-lg font-mono font-bold text-center placeholder:text-slate-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                {isFiat ? '%' : 'USD'}
              </span>
            </div>
            <button
              onClick={() => submitAnswer(false)}
              className="bg-white text-slate-950 font-bold px-5 rounded-xl hover:bg-slate-200 active:scale-95 transition flex items-center gap-1"
            >
              Enviar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-600 mt-2">
            Usá punto para miles y coma para decimales (ej: 1.500.000,5)
          </p>
        </div>
      )}

      {/* Revelación */}
      {screen === 'reveal' && lastResult && (
        <div className="w-full max-w-sm mt-6 text-center animate-[fadeIn_150ms_ease-out]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div
              className={`text-4xl font-black font-mono mb-1 ${
                lastResult.score >= 70
                  ? 'text-emerald-400'
                  : lastResult.score >= 30
                  ? 'text-amber-400'
                  : 'text-rose-500'
              }`}
            >
              +{lastResult.score} pts
            </div>
            {lastResult.timedOut && (
              <div className="text-rose-400 text-xs font-bold uppercase tracking-wide mb-2">
                Tiempo agotado
              </div>
            )}
            <div className="text-sm text-slate-400 mt-2">
              Valor real:{' '}
              <span className="font-mono font-bold text-slate-100">
                {fmt(lastResult.real)}
                {isFiat ? '%' : ' USD'}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              Tu respuesta:{' '}
              <span className="font-mono">
                {lastResult.timedOut
                  ? '—'
                  : `${fmt(lastResult.userVal)}${isFiat ? '%' : ' USD'}`}
              </span>
            </div>
          </div>
          <button
            onClick={nextRound}
            className="mt-4 text-sm text-slate-400 hover:text-white flex items-center gap-1 mx-auto transition"
          >
            Siguiente ronda <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
