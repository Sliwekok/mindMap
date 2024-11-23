class Board {
    constructor(selector) {
        this.board = document.querySelector(selector);
        if (!this.board) {
            throw new Error(`Element with selector "${selector}" not found.`);
        }

        this.currentZoomIndex = 10;
        this.zoomLevels = [
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
        ];
        this.zoomLevel = this.zoomLevels[this.currentZoomIndex]; // Initial zoom level
        this.isPanning = false; // Flag to check if panning is active
        this.position = {x: 0, y: 0};
        this.maxPosition = this.maxResolution(); // max content width and height
        this.movementSensitivity = 3;
        this.speedModifier = this.calcMovementSpeed();
        this.cardCounter = 0;
        this.maxCardWidth = 500;

        this.init();

        this.addEventListeners();
    }

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

    maxResolution() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Aspect ratio (from your image)
        const aspectRatio = screenWidth / screenHeight;  // Based on your image (width / height)

        // Calculate maximum width and height based on the aspect ratio
        const maxBoardHeight = screenHeight;
        const maxBoardWidth = screenHeight * aspectRatio;

        // Apply zoom level (assuming zoomed out to minimum zoom level)
        const zoomLevel = this.zoomLevels[0];

        // Adjust the resolution based on the zoom level
        const finalWidth = maxBoardWidth / zoomLevel;
        const finalHeight = maxBoardHeight / zoomLevel;

        return { x: finalWidth, y: finalHeight };
    }

    addEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Control' && !this.isControlPressed) {
                this.isControlPressed = true;
                this.startPan(event); // Start panning on Ctrl press
            }
        });
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Control' && this.isControlPressed) {
                this.isControlPressed = false;
                this.endPan(); // End panning on Ctrl release
            }
        });
        // Handle zooming
        this.board.addEventListener('wheel', this.handleZoom.bind(this));
        // Handle panning
        this.board.ctrlKey
        this.board.addEventListener('mousemove', this.pan.bind(this));
        this.board.addEventListener('mouseup', this.endPan.bind(this));
        this.board.addEventListener('mouseout', this.endPan.bind(this));
        // Make each card draggable
        this.board.addEventListener('mousedown', (event) => {
            const card = event.target.closest('.card');
            if (card) {
                this.startDrag(event, card);
            }
        });
        this.board.addEventListener('mousemove', (event) => {
            if (this.isDragging && this.currentCard) {
                this.drag(event);
            }
        });

        this.board.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.endDrag();
            }
        });

        this.board.querySelector('.card-content').addEventListener('keydown', (event) => {
            this.setNewTextareaSize(event.target);
        });

        this.board.querySelector('.card-content').addEventListener('paste', (event) => {
            // Delay the size adjustment until after the paste content is inserted
            setTimeout(() => this.setNewTextareaSize(event.target), 0);
        });

        this.board.querySelector('.link').addEventListener('click', this.addLink.bind(this));
    }

    addLink(event) {
        // const card = event.target.parentNode.parentNode.parentNode;

        // this.content.style.cursor = 'pointer';

    }

    setNewTextareaSize(textarea) {
        const maxWidth = this.maxCardWidth;
        const minWidth = 200;

        // Create a temporary span to measure text width
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.whiteSpace = 'pre';
        span.style.font = window.getComputedStyle(textarea).font;
        span.textContent = textarea.value || textarea.placeholder || "";
        document.body.appendChild(span);

        const contentWidth = span.offsetWidth + 10;
        document.body.removeChild(span);

        // Adjust width and height based on content size
        if (contentWidth <= maxWidth) {
            textarea.style.width = `${Math.max(contentWidth, minWidth)}px`;
            textarea.style.height = 'auto';
        } else {
            textarea.style.width = `${maxWidth}px`;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }

    startDrag(event, card) {
        if (event.ctrlKey) {
            this.isDragging = true;
            this.currentCard = card;

            // Get the bounding rectangles
            const cardRect = card.getBoundingClientRect();
            const boardRect = this.board.getBoundingClientRect();

            // Calculate the card's position relative to the board
            const cardLeft = (cardRect.left - boardRect.left) / this.zoomLevel;
            const cardTop = (cardRect.top - boardRect.top) / this.zoomLevel;

            // Set the card's position to absolute with these calculated values
            card.style.position = 'absolute';
            card.style.left = `${cardLeft}px`;
            card.style.top = `${cardTop}px`;

            // Calculate the mouse offset relative to the card
            this.offsetX = (event.clientX - cardRect.left) / this.zoomLevel;
            this.offsetY = (event.clientY - cardRect.top) / this.zoomLevel;
        }
    }

    drag(event) {
        if (this.isDragging && this.currentCard) {
            // Calculate the new card position relative to the board
            const boardRect = this.board.getBoundingClientRect();
            const newLeft = (event.clientX - boardRect.left) / this.zoomLevel - this.offsetX;
            const newTop = (event.clientY - boardRect.top) / this.zoomLevel - this.offsetY;

            // Apply the new position to the card
            this.currentCard.style.left = `${newLeft}px`;
            this.currentCard.style.top = `${newTop}px`;
        }
    }

    endDrag() {
        this.isDragging = false;
        this.currentCard = null;
    }

    calcMovementSpeed() {
        return  this.movementSensitivity / this.zoomLevel;
    }

    handleZoom(event) {
        if (event.ctrlKey) {
            let zoomChange = 0;

            // Determine zoom direction based on scroll direction
            if (event.deltaY < 0) {
                zoomChange = 1; // Zoom in
            } else if (event.deltaY > 0) {
                zoomChange = -1; // Zoom out
            }

            // Update the zoom index based on the zoom direction
            this.currentZoomIndex += zoomChange;

            // Ensure the zoom index stays within valid range
            this.currentZoomIndex = Math.max(0, Math.min(this.currentZoomIndex, this.zoomLevels.length - 1));

            // Get the new zoom level based on the index
            const newZoomLevel = this.zoomLevels[this.currentZoomIndex];

            // Calculate the scale difference between the new zoom level and the current zoom level
            const scaleDifference = newZoomLevel / this.zoomLevel;

            // Get mouse position relative to the board
            const mouseX = event.clientX - this.board.offsetLeft;
            const mouseY = event.clientY - this.board.offsetTop;

            // Update the zoom level and adjust the content's scale
            this.zoomLevel = newZoomLevel;
            this.content.style.transform = `scale(${this.zoomLevel})`;

            // Adjust the content position so the zoom happens around the cursor
            const newLeft = this.content.offsetLeft - (mouseX * (scaleDifference - 1));
            const newTop = this.content.offsetTop - (mouseY * (scaleDifference - 1));

            // Clamp the new positions within boundaries
            const maxLeft = 0;
            const minLeft = -this.maxPosition.x * this.zoomLevel + this.board.offsetWidth;
            const maxTop = 0;
            const minTop = -this.maxPosition.y * this.zoomLevel + this.board.offsetHeight;

            // Apply the clamped positions to ensure the content doesn't overflow
            requestAnimationFrame(() => {
                this.content.style.left = `${Math.min(maxLeft, Math.max(minLeft, newLeft))}px`;
                this.content.style.top = `${Math.min(maxTop, Math.max(minTop, newTop))}px`;
            });
        }
    }

    startPan(event) {
        if (event.ctrlKey) {
            this.isPanning = true;
            this.lastMousePosition = { x: event.clientX, y: event.clientY };
            this.content.style.cursor = 'grab';
        }
    }

    pan(event) {
        if (this.isPanning && (event.buttons && 1)) {  // Check if the left mouse button is held down (bit 1)
            // Calculate deltas for mouse movement (invert direction)
            const panDeltaX = (this.lastMousePosition.x - event.clientX) * this.speedModifier;
            const panDeltaY = (this.lastMousePosition.y - event.clientY) * this.speedModifier;

            // Current position of the content
            const currentLeft = parseFloat(this.content.style.left) || 0;
            const currentTop = parseFloat(this.content.style.top) || 0;

            // New positions after applying deltas
            const newLeft = currentLeft - panDeltaX;
            const newTop = currentTop - panDeltaY;

            // Clamping boundaries to prevent overflow
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
        this.content.style.cursor = 'default';
    }


    addCard() {
        let form = document.createElement("div");
        form.id = "card_" + this.cardCounter;
        form.classList.add('card');
        form.classList.add('sekcja');
        form.innerHTML = `
            <div class="sekcja-head">
                <p class="link"><i class="icon-switch"></i></p>
                <textarea class="card-textarea-title" rows="2" type="text" placeholder="Title..."></textarea>
                <p class="delete"><i class="icon-cancel"></i></p>
            </div>
            <div class="sekcja-body">
                <textarea type="text" class="card-content" placeholder="Content..."></textarea>
            </div>
        `;
        form.style.width = 'fit-content';
        form.style.height = 'fit-content';
        form.style.position = 'absolute'; // Ensure absolute positioning to set coordinates
        form.style.userSelect = 'none';
        form.style.maxWidth = this.maxCardWidth + 'px';
        form.style.zIndex = '10';

        // Temporarily add the card to measure its size
        this.content.appendChild(form);
        const cardRect = form.getBoundingClientRect();

        // Calculate the center position
        const boardRect = this.board.getBoundingClientRect(); // Board dimensions
        const contentRect = this.content.getBoundingClientRect(); // Content dimensions

        // Adjust for zoom and card width
        const centerX =
            (boardRect.width / 2 + boardRect.left - contentRect.left) / this.zoomLevel -
            cardRect.width / 2;

        const centerY =
            (boardRect.height / 2 + boardRect.top - contentRect.top) / this.zoomLevel -
            cardRect.height / 2;

        form.style.left = `${centerX}px`;
        form.style.top = `${centerY}px`;

        this.cardCounter++;
    }

}

const board = new Board('#board');
document.getElementById('addCard').addEventListener('click', () => board.addCard());
