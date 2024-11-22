class Board {
    constructor(selector) {
        this.board = document.querySelector(selector);
        if (!this.board) {
            throw new Error(`Element with selector "${selector}" not found.`);
        }

        this.zoomLevel = 2; // Initial zoom level
        this.currentZoomIndex = 10;
        this.isPanning = false; // Flag to check if panning is active
        this.position = {x: 0, y: 0};
        this.maxPosition = {x: 1000, y:1000}; // max content width and height
        this.speedModifier = 1 / this.zoomLevel;
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
        if (this.cardCounter == 0) this.addCard();
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
            this.speedModifier = 0.1 / this.zoomLevel;
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
            const panDeltaX = (event.clientX - this.lastMousePosition.x) * this.speedModifier;
            const panDeltaY = (event.clientY - this.lastMousePosition.y) * this.speedModifier;

            // Calculate new positions
            const newLeft = this.content.offsetLeft - panDeltaX;
            const newTop = this.content.offsetTop - panDeltaY;

            // Calculate clamping boundaries
            const maxLeft = 0;
            const minLeft = -this.maxPosition.x * this.zoomLevel + this.board.offsetWidth;

            const maxTop = 0;
            const minTop = -this.maxPosition.y * this.zoomLevel + this.board.offsetHeight;

            // Correctly clamp values
            const clampedLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
            const clampedTop = Math.min(maxTop, Math.max(minTop, newTop));

            console.log({ minLeft, maxLeft, newLeft, minTop, maxTop, newTop, clampedLeft, clampedTop });

            // Apply clamped values
            requestAnimationFrame(() => {
                this.content.style.left = `${clampedLeft}px`;
                this.content.style.top = `${clampedTop}px`;
            });

            // Update last mouse position
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
