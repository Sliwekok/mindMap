class Board {
    constructor(selector) {
        this.board = document.querySelector(selector);
        if (!this.board) {
            throw new Error(`Element with selector "${selector}" not found.`);
        }

        this.movementSensitivity = 3;
        this.zoomLevel = 2; // Initial zoom level
        this.currentZoomIndex = 10;
        this.isPanning = false; // Flag to check if panning is active
        this.position = {x: 0, y: 0};
        this.maxPosition = {x: 1000, y:1000}; // max content width and height
        this.speedModifier = this.calcMovementSpeed();
        this.zoomLevels = [
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
        ];
        this.cardCounter = 0;

        this.init();

        this.addEventListeners();    }

    init() {
        /* add content */
        let content = document.createElement("div");
        content.id = "boardContent";
        content.style.width = this.maxPosition.x.toString() + 'px';
        content.style.height = this.maxPosition.y.toString() + 'px';
        content.style.transformOrigin = 'top left';
        content.style.position = 'relative';
        content.style.userSelect = 'none';
        content.style.top = '0px';
        content.style.left = '0px';
        this.board.appendChild(content);
        this.content = content;
        /* end add content */
        /* set current position to the center*/
        let rect = this.board.getBoundingClientRect();
        this.position.x = (rect.left + rect.width / 2) / this.zoomLevel;
        this.position.y = (rect.top + rect.height / 2) / this.zoomLevel;
        /* end current position */

        /* count current cards */
        this.cardCounter = this.content.querySelectorAll('.card').length;

        /* add card if no cards */
        if (this.cardCounter === 0) this.addCard();
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

    calcMovementSpeed() {
        return  this.movementSensitivity / this.zoomLevel;
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
            console.log(this.zoomLevel, this.currentZoomIndex);
            this.zoomLevel = this.zoomLevels[this.currentZoomIndex];
            this.speedModifier =  calcMovementSpeed();
        }
    }

    startPan(event) {
        if (event.ctrlKey) {
            this.isPanning = true;
            this.lastMousePosition = { x: event.clientX, y: event.clientY };
        }
    }

    pan(event) {
        if (this.isPanning) {
            // Calculate deltas for mouse movement (invert direction)
            const panDeltaX = (this.lastMousePosition.x - event.clientX) * this.speedModifier;
            const panDeltaY = (this.lastMousePosition.y - event.clientY) * this.speedModifier;

            // Current position of the content
            const currentLeft = parseFloat(this.content.style.left) || 0;
            const currentTop = parseFloat(this.content.style.top) || 0;

            // New positions after applying deltas
            const newLeft = currentLeft - panDeltaX;
            const newTop = currentTop - panDeltaY;

            // Clamping boundaries
            const maxLeft = 0;
            const minLeft = -this.maxPosition.x * this.zoomLevel + this.board.offsetWidth;

            const maxTop = 0;
            const minTop = -this.maxPosition.y * this.zoomLevel + this.board.offsetHeight;

            // Clamp the new positions within boundaries
            const clampedLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
            const clampedTop = Math.min(maxTop, Math.max(minTop, newTop));

            // Apply the clamped values
            requestAnimationFrame(() => {
                this.content.style.left = `${clampedLeft}px`;
                this.content.style.top = `${clampedTop}px`;
            });

            // Update the last mouse position
            this.lastMousePosition = { x: event.clientX, y: event.clientY };
        }
    }

    endPan() {
        this.isPanning = false;
    }


    addCard() {
        let form = document.createElement("div");
        form.id = "card_" + this.cardCounter;
        form.class = 'card';
        form.innerHTML = `<form><p><h2>title</h2></p><p>contet content content</p></form>`
        form.style.width = '200px';
        form.style.height = '200px';
        form.style.position = 'relative';
        form.style.userSelect = 'none';
        this.content.appendChild(form);
        this.cardCounter++;
    }
}

const board = new Board('#board');
document.getElementById('addCard').addEventListener('click', () => board.addCard());
