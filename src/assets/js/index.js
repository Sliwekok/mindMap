const previousFilesContainer = document.querySelector('.previousFiles');
if (previousFilesContainer) {
    const savedBoards = JSON.parse(localStorage.getItem('savedBoards') || '[]');
    previousFilesContainer.innerHTML = '';
    if (savedBoards.length > 0) {
        savedBoards.forEach((board, index) => {
            if (index >= 10) return;
            const boardEntry = document.createElement('p');
            boardEntry.className = 'board-history';
            boardEntry.innerHTML = `<a href="board.html?id=${index}">${index + 1}. ${board.title}</a> - ${board.cards.length} cards<br>Updated at: ${board.date}`;
            previousFilesContainer.appendChild(boardEntry);
        });
    } else {
        previousFilesContainer.innerHTML = 'No boards created yet - start now!';
    }

    const openButton = document.querySelector('#openFromFile');
    openButton.addEventListener('click',  async () => {
        let file = await window.electronAPI.openFile();
        const {filePath} = file;
        let path = "board.html?id="+filePath;
        window.location.replace(path);
    });


}
// localStorage.removeItem('savedBoards');
