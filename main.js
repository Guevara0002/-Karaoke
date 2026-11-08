(() => {
  'use strict';

  // ---------- Conexión con el HTML ----------
  const form = document.getElementById('song_form');
  const playlist = document.getElementById('play_list');
  const counter = document.getElementById('song_count');
  const urlInput = document.getElementById('url_song');

  const STORAGE_KEY = 'karaoke-pip-y-pop';
  const AVATAR_COLORS = [
    ['#ff5e6c', '#ffb347'], ['#8e2fa8', '#d36bff'], ['#2f80ed', '#56ccf2'], ['#27ae60', '#a8e063'],
    ['#f2994a', '#f2c94c'], ['#eb4d8f', '#ff9a9e'], ['#16a085', '#48dbfb'], ['#5f4bb6', '#a29bfe']
  ];

  // ---------- Datos ----------
  const loadSongs = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  };
  const saveSongs = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(songs)); }
    catch { }
  };
  let songs = loadSongs();

  // ---------- Utilidades ----------
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const isHttpUrl = (value) => {
    try { return ['http:', 'https:'].includes(new URL(value).protocol); }
    catch { return false; }
  };

  const hashColors = (text) => {
    const sum = [...text].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const [from, to] = AVATAR_COLORS[sum % AVATAR_COLORS.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  };

  const getYoutubeId = (value) => {
    try {
      const url = new URL(value);
      if (url.hostname === 'youtu.be') return url.pathname.slice(1);
      if (url.hostname.endsWith('youtube.com')) {
        return url.searchParams.get('v') || url.pathname.split('/').pop();
      }
    } catch { /* URL no válida */ }
    return null;
  };

  // ---------- Elementos visuales ----------
  const createAvatar = (name) => {
    const avatar = create('span', 'avatar', name.trim().charAt(0).toUpperCase());
    avatar.style.background = hashColors(name);
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
  };

  const createFallbackCover = (song) => {
    const cover = create('div', 'cover cover--fallback', '♪');
    cover.style.background = hashColors(song.song + song.artist);
    return cover;
  };

  const createCover = (song) => {
    const videoId = getYoutubeId(song.url);
    if (!videoId) return createFallbackCover(song);

    const img = create('img', 'cover');
    img.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => img.replaceWith(createFallbackCover(song)));
    return img;
  };

  const createSongItem = (song, index) => {
    const item = create('li', 'song');
    if (index === 0) item.classList.add('song--first');
    if (song.id === lastAddedId) item.classList.add('enter');

    const body = create('div', 'song__body');
    const singer = create('div', 'singer');
    singer.append(createAvatar(song.singer), create('span', '', `Canta ${song.singer}`));
    if (index < 2) singer.append(create('span', 'tag', index === 0 ? '¡Abre el show!' : 'Sigue'));
    body.append(create('strong', 'song__title', song.song), create('span', 'song__artist', song.artist), singer);

    const listen = create('a', 'btn btn--ghost', 'Escuchar');
    listen.href = song.url;
    listen.target = '_blank';
    listen.rel = 'noopener noreferrer';

    const remove = create('button', 'btn btn--icon', '✕');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Eliminar ${song.song} de ${song.singer}`);
    remove.addEventListener('click', () => removeSong(song.id));

    const actions = create('div', 'song__actions');
    actions.append(listen, remove);

    const position = create('span', 'song__pos', `${index + 1}.º`);
    position.setAttribute('aria-label', `Turno ${index + 1}`);

    item.append(position, createCover(song), body, actions);
    return item;
  };

  // ---------- Renderizado ----------
  let lastAddedId = null;

  const render = () => {
    playlist.replaceChildren(...songs.map(createSongItem));
    counter.textContent = `${songs.length} ${songs.length === 1 ? 'canción' : 'canciones'}`;
    lastAddedId = null;
  };

  // ---------- Acciones ----------
  const addSong = (singer, song, artist, url) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    songs.push({ id, singer, song, artist, url });
    lastAddedId = id;
    saveSongs();
    render();
  };

  const removeSong = (id) => {
    songs = songs.filter((song) => song.id !== id);
    saveSongs();
    render();
  };

  // ---------- Eventos ----------
  urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const singer = form.singer_name.value.trim();
    const song = form.song_name.value.trim();
    const artist = form.artist_name.value.trim();
    const url = urlInput.value.trim();

    if (!singer || !song || !artist || !url) {
      form.reportValidity();
      return;
    }
    if (!isHttpUrl(url)) {
      urlInput.setCustomValidity('Ingresa un enlace que empiece con http:// o https://');
      urlInput.reportValidity();
      return;
    }

    addSong(singer, song, artist, url);
    form.reset();
    playlist.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  render();
})();