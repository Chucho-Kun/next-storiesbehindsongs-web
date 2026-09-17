Este proyecto será realizado en la ultima version de Next.js y tomará el diseño que tiene el sitio web https://storiesbehindsongs.com/ pero ajustandolo a nuevas tecnologias como

- TailwindCSS
- Next (ultima version)
- Base de datos en PostgreSQL
- Componentes reciclables
- Optimización para SEO
- Optimización de imágenes en .webp

La base de datos tendrá una estructura parecida a la de /ejemplos/bd/stories.sql

* El front del sitio web deberá estar en idioma inglés y deberá mostrar las siguientes secciones que deberán ser componentes de next separados en la carpeta src/shared/  

Componentes:

A- Header: Fondo color negro con el logo que yo subiré y un buscador a la derecha para encontrar alguna canción por el nombre o la banda 

B- Secciones:

1.- Banner de youtube con vinculo directo al canal https://www.youtube.com/@StoriesBehindTheSongs, esta imagen la proporciono yo

2.- Una sección de tags más populares que se alimenta de la base de datos en postgre

3.- Una sección de "Bands More Popular" que mostrará los logos de las bandas que tienen historias hasta ahora

4.- Una sección de "Recent Articles" que se alimenta de la base de datos de postgre. Estas fichas serán un componente reutilizable que muestra las caracteristicas que muestran en /ejemplos/screenshots/ficha.png (muestra 20 resultados al principio pero deberá llevar un botón "VIEW MORE" para cargar otros 20 siguientes)

5.- Una sección de "Most Popular Songs" igualmente alimentado desde la base de datos de postgre y con el diseño reutilizado de la ficha /ejemplos/screenshots/ficha.png (muestra 20 resultados al principio pero deberá llevar un botón "VIEW MORE" para cargar otros 20 siguientes)

Footer: Se agregan secciones como "About Us", "Notice of Privacy", "Contact", y la lista de las Redes Sociales que te puedo proporcionar

Finalmente un listo negro con el siguiente texto "storiesbehindsongs.com is a platform that publishes and stores information from different articles about popular songs, for the sole purpose of entertainment | 2026"

