// Modal-Handling
      const btnNewTree = document.getElementById('btn-new-tree');
      const overlay    = document.getElementById('overlay-tree');
      const modal      = document.getElementById('modal-tree');
      const btnCancel  = document.getElementById('modal-cancel-tree');
      const btnSave    = document.getElementById('modal-save-tree');

      btnNewTree.addEventListener('click', () => {
        overlay.style.display = 'block';
        modal.style.display   = 'block';
      });
      btnCancel.addEventListener('click', () => {
        overlay.style.display = 'none';
        modal.style.display   = 'none';
      });

      btnSave.addEventListener('click', () => {
        const name = document.getElementById('tree-name').value.trim();
        const desc = document.getElementById('tree-desc').value.trim();
        if (!name) {
          return alert('Bitte einen Namen eingeben.');
        }
        fetch('api/add_tree.php', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ name, description: desc })
        })
        .then(r => r.json())
        .then(data => {
          if (data.status === 'success') {
            // direkt in den Editor weiterleiten, tree_id als GET-Parameter
            window.location.href = 'canvas.php?tree_id=' + data.id;
          } else {
            alert('Fehler: ' + (data.message || 'Unbekannt'));
          }
        })
        .catch(err => {
          console.error(err);
          alert('Netzwerkfehler. Siehe Konsole.');
        });
      });

      // Modal schließen, wenn Overlay angeklickt
      overlay.addEventListener('click', () => {
        overlay.style.display = 'none';
        modal.style.display   = 'none';
      });