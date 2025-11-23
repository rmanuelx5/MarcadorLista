document.addEventListener("DOMContentLoaded", () => {
  const inputFile = document.createElement('input');
  inputFile.type = 'file';
  inputFile.accept = '.txt';

  const progresoFile = document.createElement('input');
  progresoFile.type = 'file';
  progresoFile.accept = '.txt';

  const loadBtn = document.createElement('button');
  loadBtn.textContent = '📂 Cargar archivo de episodios';
  loadBtn.style.marginBottom = '20px';

  document.body.insertBefore(loadBtn, document.querySelector('table'));

  const savedText = localStorage.getItem('episodeFileText');
  if (savedText) {
    iniciarTabla(savedText);
    updateButtonText();
  }

  loadBtn.addEventListener('click', () => {
    if (localStorage.getItem('episodeFileText')) {
      localStorage.removeItem('episodeFileText');
      const table = document.querySelector('#episodeTable tbody');
      if (table) table.innerHTML = '';
      updateButtonText();
    } else {
      inputFile.click();
    }
  });

  inputFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rawText = reader.result;
      localStorage.setItem('episodeFileText', rawText);
      iniciarTabla(rawText);
      updateButtonText();
    };
    reader.readAsText(file);
  });

  function updateButtonText() {
    loadBtn.textContent = localStorage.getItem('episodeFileText') ? '❌ Cerrar archivo de episodios' : '📂 Cargar archivo de episodios';
  }

  updateButtonText();

  // PROGRESO: importar / exportar
  document.getElementById('gestionarProgresoBtn').addEventListener('click', () => {
    const opcion = confirm("¿Querés importar (Aceptar) o exportar (Cancelar) el progreso?");
    if (opcion) {
      progresoFile.click();
    } else {
      exportarUltimoVisto();
    }
  });

  progresoFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const key = reader.result.trim();
      localStorage.setItem('lastSeenFromFile', key);
      updateVistoPorOrden(key);
      updateViendo();
    };
    reader.readAsText(file);
  });
});

let globalRowRefs = [];

function iniciarTabla(rawText) {
  const lines = rawText.trim().split('\n').filter(l => l.match(/^\d{3}\./));
  const table = document.querySelector('#episodeTable tbody');
  table.innerHTML = '';
  globalRowRefs = [];

  lines.forEach(line => {
    const match = line.match(/(Chicago Fire|Chicago PD|Chicago Med|Law & Order: SVU|Chicago Justice|FBI).*?(S\\d+E\\d+)/);
    const episodeKey = match ? `${match[1]} ${match[2]}` : line;

    let seriesClass = 'other';
    if (line.includes('Chicago Fire')) seriesClass = 'fire';
    else if (line.includes('Chicago PD')) seriesClass = 'pd';
    else if (line.includes('Chicago Med')) seriesClass = 'med';
    else if (line.includes('Law & Order: SVU')) seriesClass = 'svu';
    else if (line.includes('Chicago Justice')) seriesClass = 'justice';
    else if (line.includes('FBI')) seriesClass = 'fbi';

    const row = document.createElement('tr');
    row.classList.add(seriesClass);

    const cellName = document.createElement('td');
    cellName.textContent = line;

    const cellCheck = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = localStorage.getItem(episodeKey) === 'true';

    if (checkbox.checked) row.classList.add('visto');

    row.appendChild(cellName);
    row.appendChild(cellCheck);
    cellCheck.appendChild(checkbox);

    row.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      localStorage.setItem(episodeKey, checkbox.checked);
      row.classList.toggle('visto', checkbox.checked);
      localStorage.setItem('lastSeenFromFile', episodeKey); // se guarda automáticamente
      updateViendo();
    });

    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.setItem(episodeKey, checkbox.checked);
      row.classList.toggle('visto', checkbox.checked);
      localStorage.setItem('lastSeenFromFile', episodeKey);
      updateViendo();
    });

    table.appendChild(row);
    globalRowRefs.push({ row, checkbox, key: episodeKey });
  });

  if (localStorage.getItem('lastSeenFromFile')) {
    updateVistoPorOrden(localStorage.getItem('lastSeenFromFile'));
  }

  updateViendo();

  if (!localStorage.getItem('autoScrollDone')) {
    scrollToFirstUnwatched();
    localStorage.setItem('autoScrollDone', 'true');
  }
}

function updateVistoPorOrden(lastKey) {
  let marcar = true;
  globalRowRefs.forEach(({ row, checkbox, key }) => {
    if (marcar) {
      checkbox.checked = true;
      row.classList.add('visto');
      localStorage.setItem(key, true);
    } else {
      checkbox.checked = false;
      row.classList.remove('visto');
      localStorage.removeItem(key);
    }
    if (key.trim() === lastKey.trim()) {
      marcar = false;
    }
  });
}

function updateViendo() {
  globalRowRefs.forEach(ref => ref.row.classList.remove('viendo'));
  const next = globalRowRefs.find(ref => !ref.checkbox.checked);
  if (next) {
    next.row.classList.add('viendo');
    scrollToFirstUnwatched(); // 👉 desplazarse al siguiente
  }
}


function scrollToFirstUnwatched() {
  const first = globalRowRefs.find(ref => !ref.checkbox.checked);
  if (first) {
    first.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function exportarUltimoVisto() {
  const last = localStorage.getItem('lastSeenFromFile');
  if (!last) {
    alert('No hay progreso para exportar.');
    return;
  }

  const blob = new Blob([last], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ultimo.txt';
  a.click();
}

// Scroll arriba al hacer clic en el botón flotante
document.getElementById('btnTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// window.addEventListener('pagehide', () => {
//   const last = localStorage.getItem('lastSeenFromFile');
//   if (!last) return;

//   const blob = new Blob([last], { type: 'text/plain' });
//   const url = URL.createObjectURL(blob);

//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'ultimo.txt';
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);

//   URL.revokeObjectURL(url);
// });
