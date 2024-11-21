class Board {
    constructor(selector) {
        this.board = document.querySelector(selector);
        if (!this.board) {
            throw new Error(`Element with selector "${selector}" not found.`);
        }

        this.content = document.querySelector('#boardContent');
        this.zoomLevel = 2; // Initial zoom level
        this.minZoom = 0.7;
        this.maxZoom = 5;
        this.zoomStep = 1; // Step size for each zoom level change
        this.currentZoomIndex = 10;
        this.isPanning = false; // Flag to check if panning is active
        this.position = {x: 0, y: 0};
        this.speedModifier = 1 / this.zoomLevel;
        this.zoomLevels = [
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
        ];

        this.addEventListeners();
    }

    addEventListeners() {
        // Handle zooming
        this.board.addEventListener('wheel', this.handleZoom.bind(this));
        // Handle panning
        this.board.addEventListener('mousedown', this.startPan.bind(this));
        this.board.addEventListener('mousemove', this.pan.bind(this));
        this.board.addEventListener('mouseup', this.endPan.bind(this));
        this.board.addEventListener('mouseout', this.endPan.bind(this));
    }

    handleZoom(event) {
        if (this.isPanning) {
            if (event.deltaY < 0) {
                // Zoom in
                if (this.currentZoomIndex < this.zoomLevels.length - 1) {
                    this.currentZoomIndex++;
                }
            } else {
                // Zoom out
                if (this.currentZoomIndex > 0) {
                    this.currentZoomIndex--;
                }
            }
            this.zoomLevel = this.zoomLevels[this.currentZoomIndex];
        }
    }

    startPan(event) {
        if (event.ctrlKey) {
            this.isPanning = true;
        }
    }
    pan(event) {
        if (this.isPanning) {
            // Calculate how much the mouse has moved since the start
            const panDeltaX = event.clientX - this.position.x;
            const panDeltaY = event.clientY - this.position.y;

            // Update the div's position based on the pan delta
            this.content.style.left = (this.content.offsetLeft - panDeltaX * this.speedModifier) + 'px';
            this.content.style.top = (this.content.offsetTop - panDeltaY * this.speedModifier) + 'px';

            // Update the starting position for the next movement
            this.position.x = this.position.x + panDeltaX;
            this.position.y = this.position.y + panDeltaY;

            console.log(this.position);
        }
    }
    endPan() {
        this.isPanning = false;
    }


    addCard() {
        return 1;
    }
}

const board = new Board('#board');
document.getElementById('addCard').addEventListener('click', () => board.addCard());
