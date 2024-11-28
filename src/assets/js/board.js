class Board {
    constructor(selector, size) {
        this.board = document.querySelector(selector);
        if (!this.board) {
            throw new Error(`Element with selector "${selector}" not found.`);
        }

        this.currentZoomIndex = 10;
        this.zoomLevels = [
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0,
        ];
        this.size = size;
        this.zoomLevel = this.zoomLevels[this.currentZoomIndex]; // Initial zoom level
        this.isPanning = false; // Flag to check if panning is active
        this.position = {x: 0, y: 0};
        this.maxPosition = this.maxResolution(size); // max content width and height
        this.movementSensitivity = 3;
        this.speedModifier = this.calcMovementSpeed();
        this.cards = [];
        this.maxCardWidth = 500;
        this.relations = [];
        this.selectedCard = null;
        this.defaultCardColor = '#3399ff';

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

        this.addSvgLines();

        /* add card if no cards */
        let loaded = location.search.split('id=')[1];
        if (loaded !== undefined) {
            this.loadFromFile(loaded);
            document.querySelector('#map-title').value = JSON.parse(localStorage.getItem('savedBoards'))[loaded].title;
        } else {
            this.addCard();
        }
    }

    addSvgLines() {
        let svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgContainer.id = "lineContainer";
        svgContainer.style.position = "absolute";
        svgContainer.style.top = "0";
        svgContainer.style.left = "0";
        svgContainer.style.width = "100%";
        svgContainer.style.height = "100%";
        svgContainer.style.pointerEvents = "none"; // Allow clicks to pass through
        svgContainer.style.zIndex = "1"; // Place it under the cards
        this.content.appendChild(svgContainer);
        this.svgContainer = svgContainer;
    }

    maxResolution(size) {
        const screenWidth = this.board.getBoundingClientRect().width;
        const screenHeight = this.board.getBoundingClientRect().height;

        // Aspect ratio (from your image)
        const aspectRatio = screenWidth / screenHeight;  // Based on your image (width / height)

        // Calculate maximum width and height based on the aspect ratio
        const maxBoardHeight = screenHeight;
        const maxBoardWidth = screenHeight * aspectRatio;

        // Apply zoom level (assuming zoomed out to minimum zoom level)
        const zoomLevel = this.zoomLevels[0];

        // Adjust the resolution based on the zoom level and size
        let sizeModificator = 0;
        switch (size) {
            case 'small': sizeModificator = 0.25; break;
            case 'medium': sizeModificator = 0.5; break;
            case 'large': sizeModificator = 0.75; break;
            case 'very-large': sizeModificator = 1; break;
        }

        const finalWidth = (maxBoardWidth / zoomLevel) * sizeModificator;
        const finalHeight = (maxBoardHeight / zoomLevel) * sizeModificator;

        return { x: finalWidth, y: finalHeight };
    }

    addEventListeners() {
        this.board.addEventListener('keydown', (event) => {
            if (event.key === 'Control' && !this.isControlPressed) {
                this.isControlPressed = true;
                this.startPan(event); // Start panning on Ctrl press
            }
        });
        this.board.addEventListener('keyup', (event) => {
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
                // update lines to prevent from loosing track
                this.updateAllLines();
                this.startDrag(event, card);
            }
        });
        this.board.addEventListener('mousemove', (event) => {
            if (this.isDragging && this.currentCard) {
                this.drag(event);
                // update lines to prevent from loosing track
                this.updateAllLines();
            }
        });

        this.board.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.endDrag();
                // update lines to prevent from loosing track
                this.updateAllLines();
            }
        });

        this.board.querySelector('.card-content').addEventListener('keydown', (event) => {
            this.setNewTextareaSize(event.target);
        });

        this.board.querySelector('.card-content').addEventListener('paste', (event) => {
            // Delay the size adjustment until after the paste content is inserted
            setTimeout(() => this.setNewTextareaSize(event.target), 0);
        });

        // add card linking and relations
        this.board.addEventListener('click', (event) => {
            const linkIcon = event.target.closest('.link');
            if (linkIcon) {
                this.addLink(event);
            }
        });

        // delete card
        this.board.addEventListener('click', (event) => {
            const button = event.target.closest('.delete');
            if (button && confirm('Are you sure you want to delete this card?') === true) {
                this.deleteCard(event);
            }
        });

        // save typed new values in cards
        this.board.addEventListener('input', (event) => {
            const textarea = event.target;

            // Check if the input event is triggered by a textarea within a card
            if (textarea.matches('.card textarea')) {
                const cardChanged = textarea.closest('.card'); // Find the closest card container
                let card = this.cards.find(card => card.id === cardChanged.id);

                if (textarea.classList.contains('card-textarea-title')) {
                    card.content.title = textarea.value;
                } else {
                    card.content.text = textarea.value;
                }

                this.updateNavCardSelector();
            }
        });
    }

    addLink(event) {
        // Identify the card that was clicked
        const icon = event.target;
        const card = event.target.closest('.card');

        if (!this.selectedCard) {
            // If no card is selected, store this card as the first card
            this.selectedCard = card;
            icon.parentNode.classList.add('linking'); // Optionally highlight the card
        } else {
            // If a card is already selected, create a link to this card
            this.createLine(this.selectedCard, card);
            // Clear the selected card and remove highlighting
            const linkingElements = this.board.querySelectorAll('.linking');
            linkingElements.forEach(element => {
                element.classList.remove('linking');
            });
            this.selectedCard = null;
        }
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

            this.updateAllLines();
        }
    }

    endDrag() {
        this.isDragging = false;
        this.currentCard = null;
    }

    calcMovementSpeed() {
        return  this.movementSensitivity / this.zoomLevel;
    }

    handleZoom(event, isForced = false) {
        if (event.ctrlKey || isForced) {
            let zoomChange = 0;

            // Determine zoom direction based on scroll direction
            if (event.deltaY < 0) {
                zoomChange = 1; // Zoom in
            } else if (event.deltaY > 0) {
                zoomChange = -1; // Zoom out
            }

            // Calculate the new zoom index
            const newZoomIndex = this.currentZoomIndex + zoomChange;

            // Ensure the zoom index stays within valid range
            if (newZoomIndex < 0 || newZoomIndex >= this.zoomLevels.length) {
                return; // Prevent invalid zoom level
            }

            // Get the proposed new zoom level
            const newZoomLevel = this.zoomLevels[newZoomIndex];

            // Check if zooming out would violate the minimum resolution
            if (zoomChange === -1) { // Zooming out
                const minResolution = this.maxPosition;
                const proposedWidth = this.board.offsetWidth / newZoomLevel;
                const proposedHeight = this.board.offsetHeight / newZoomLevel;
                // Prevent zooming out if it violates the minimum resolution
                if (proposedWidth > minResolution.x || proposedHeight > minResolution.y) {
                    return;
                }
            }

            // Update the zoom index
            this.currentZoomIndex = newZoomIndex;

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

            // Update lines to prevent from losing track
            this.updateAllLines();
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
            // update lines to prevent from loosing track
            this.updateAllLines()
        }
    }

    endPan() {
        this.isPanning = false;
        this.content.style.cursor = 'default';
    }


    addCard(cardLoaded = null) {
        let card = document.createElement("div");
        if (cardLoaded === null || cardLoaded === undefined) {
            const highestId =  this.cards.reduce((max, card) => {
                const match = card.id.split('_');
                const id = parseInt(match[1], 10) ?? 0; // Extract and parse or default to 0
                return Math.max(max, id);
            }, 0);
            card.id = "card_" + (highestId + 1);
        } else {
            card.id = cardLoaded.id;
        }
        card.classList.add('card');
        card.classList.add('sekcja');
        const title = cardLoaded?.content.title ?? '';
        const content = cardLoaded?.content.text ?? '';
        card.innerHTML = `
            <div class="sekcja-head">
                <p class="link"><i class="icon-switch"></i></p>
                <textarea class="card-textarea-title" rows="2" type="text" placeholder="Title...">${title}</textarea>
                <p class="delete"><i class="icon-cancel"></i></p>
            </div>
            <div class="sekcja-body">
                <textarea type="text" class="card-content" placeholder="Content...">${content}</textarea>
            </div>
        `;
        card.style.width = 'fit-content';
        card.style.height = 'fit-content';
        card.style.position = 'absolute'; // Ensure absolute positioning to set coordinates
        card.style.userSelect = 'none';
        card.style.maxWidth = this.maxCardWidth + 'px';
        card.style.zIndex = '10';

        // Temporarily add the card to measure its size
        this.content.appendChild(card);
        const cardRect = card.getBoundingClientRect();

        card.querySelector('.sekcja-head').style.background = cardLoaded?.styles.background_color ?? this.defaultCardColor;

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


        card.style.left = cardLoaded?.styles.left ? cardLoaded?.styles.left + 'px' : `${centerX}px`;
        card.style.top = cardLoaded?.styles.top ? cardLoaded?.styles.top + 'px' : `${centerY}px`;

        const cardOptions = {
            'id': card.id,
            'styles': {
                'top': cardLoaded?.top ?? centerY,
                'left': cardLoaded?.left ?? centerX,
                'background_color': cardLoaded?.background_color ?? this.defaultCardColor
            },
            'content': {
                'title': cardLoaded?.content?.title ?? '',
                'text': cardLoaded?.content?.text ?? ''
            },
            'misc' : card
        }

        if (!cardLoaded?.id) this.cards.push(cardOptions);
        this.updateNavCardSelector();
    }

    deleteCard(event) {
        const card = event.target.closest('.card');
        // Remove the card from the DOM
        if (card && card.parentNode) {
            card.parentNode.removeChild(card);
        }

        // Remove all lines associated with the card
        this.removeRelation(card);

        this.updateNavCardSelector();
    }

    updateLinePosition (card1, card2, line) {
        const rect1 = card1.getBoundingClientRect();
        const rect2 = card2.getBoundingClientRect();

        const x1 = (rect1.left + rect1.width / 2) - this.board.getBoundingClientRect().left;
        const y1 = (rect1.top + rect1.height / 2) - this.board.getBoundingClientRect().top;

        const x2 = (rect2.left + rect2.width / 2) - this.board.getBoundingClientRect().left;
        const y2 = (rect2.top + rect2.height / 2) - this.board.getBoundingClientRect().top;

        line.setAttribute("x1", x1 / this.zoomLevel);
        line.setAttribute("y1", y1 / this.zoomLevel);
        line.setAttribute("x2", x2 / this.zoomLevel);
        line.setAttribute("y2", y2 / this.zoomLevel);
    };

    createLine(card1, card2) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("stroke", "red");
        line.setAttribute("stroke-width", "4");
        this.svgContainer.appendChild(line);
        // Initial position
        this.updateLinePosition(card1, card2, line);

        // Add the line and related cards to the relations registry
        this.relations.push({ line, card1, card2, 'card1_id': card1.id, 'card2_id': card2.id });

        // Return the line for further handling if needed
        return line;
    }

    updateAllLines() {
        if (this.isUpdatingLines) return; // Prevent multiple calls
        this.isUpdatingLines = true;
        requestAnimationFrame(() => {
            this.relations.forEach(relation => { 
                this.updateLinePosition(relation.card1, relation.card2, relation.line);
        });
            // this.relations.forEach(relation => {
            // });
            this.isUpdatingLines = false;
        });
    }

    removeRelation(card) {
        // Filter out relations that involve the specified card
        const remainingRelations = [];
        this.relations.forEach(relation => {
            if (relation.card1 === card || relation.card2 === card) {
                // Remove the SVG line element from the DOM
                this.deleteLine(relation.line);
            } else {
                remainingRelations.push(relation);
            }
        });

        // Update the relations array
        this.relations = remainingRelations;
    }

    deleteLine(line) {
        if (line && line.parentNode) {
            line.parentNode.removeChild(line);
        }
    }

    updateNavCardSelector() {
        const selector = document.querySelector('#card-selector');
        selector.innerHTML = '<option value="">-</option>'; // delete all options in selector
        this.cards.forEach(card => {
            let title = card.content.title;
            selector.innerHTML += `
                <option value="${card.id}">${title}</option>
            `;
        });
    }

    updateCardBackgroundColor(card, color) {
        let cardSelected = this.content.querySelector('#' + card);
        cardSelected.querySelector('.sekcja-head').style.background = color;

        let cardArray = this.cards.find(currCard => currCard.id == card);
        cardArray.styles.background_color = color;
    }

    getBoardProperties(title) {
        const boardState = {
            zoomLevel: this.zoomLevel,
            currentZoomIndex: this.currentZoomIndex,
            position: this.position,
            maxPosition: this.maxPosition,
            size: this.size,
            cards: this.cards,
            relations: this.relations,
            title: title,
            date: new Date().toISOString().replace('T', ' ').slice(0, 19), // date in Y-m-d H:i:s format
        };

        return boardState;
    }

    updateMapSize(size) {
        this.size = size;
        this.maxPosition = this.maxResolution(size);
    }

    loadFromFile(id) {
        const allBoards = JSON.parse(localStorage.getItem('savedBoards'));
        this.setProperties(allBoards[id]);
        this.maxResolution(this.size);
        this.updateMapSize(this.size);
        this.handleZoom(new Event('keydown', {ctrlKey: true}), true)
        this.cards.forEach((card) => {
            this.addCard(card);
        })
        let tempRelations = this.relations;
        this.relations = [];
        tempRelations.forEach((relation) => {
            this.createLine(this.board.querySelector('#' + relation.card1_id), this.board.querySelector('#' + relation.card2_id),)
        });
    }

    setProperties(data) {
        this.currentZoomIndex = data.currentZoomIndex,
        this.zoomLevel = data.zoomLevel;
        this.position = data.position;
        this.maxPosition = data.maxPosition;
        this.size = data.size;
        this.cards = data.cards;
        this.relations = data.relations;
        this.title = data.title;
    }

}
if (document.querySelector('#board')) {
    const size = document.querySelector('#map-size');
    const board = new Board('#board', size.value);
    document.querySelector('#addCard').addEventListener('click', () => board.addCard());
    document.querySelector('#card-change-color').addEventListener('change', () => {
        const color = document.querySelector('#card-change-color').value;
        const card = document.querySelector('#card-selector')
        if (card.value === '') {
            alert('Choose a card first');

            return false;
        }
        board.updateCardBackgroundColor(card.value, color);
    });

    document.querySelector('#save').addEventListener('click', async () => {
        const title = document.querySelector('#map-title').value;
        if (title === '') {
            alert('Name your map first!');
            return false;
        }

        const result = await window.electronAPI.saveFile({
            title: 'Save your map',
            defaultPath: title + '.json',
            filters: [
                {name: 'JSON Files', extensions: ['json']},
                {name: 'All Files', extensions: ['*']},
            ],
        });

        if (!result.canceled) {
            const boardProperties = board.getBoardProperties(title);
            const content = {
                title: title,
                data: boardProperties,
            };
            window.electronAPI.saveContentToFile(result.filePath, JSON.stringify(content));
            // Get the saved boards from localStorage or initialize as an empty array if not found
            let savedBoards = JSON.parse(localStorage.getItem('savedBoards') || '[]');
            if (!Array.isArray(savedBoards)) {
                savedBoards = [];
            }
            const loaded = location.search.split('id=')[1];
            if (loaded) {
                savedBoards[loaded] = boardProperties;
            } else {
                savedBoards.push(boardProperties);
            }
            localStorage.setItem('savedBoards', JSON.stringify(savedBoards));
        }

    });
    size.addEventListener('change', () => board.updateMapSize(size.value));
}
