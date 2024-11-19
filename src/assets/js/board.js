$(document).ready(function () {
    let zoomLevel = 2; // Initial zoom level
    const minZoom = 0.7; // Minimum zoom (50% of original size)
    const maxZoom = 5; // Maximum zoom (300% of original size)
    const zoomStep = 0.1; // Step size for each zoom level change
    const board = $("#board");
    const content = $("#boardContent");
    let isPanning = false; // Flag to check if panning is active
    let startX, startY; // Starting coordinates for panning
    let currentX = 0, currentY = 0; // Current translation values
    const speedModifier = 1 / zoomLevel;

    board.on('wheel', function (event) {
        if (event.ctrlKey) {
            event.preventDefault(); // Prevent default behavior like page zooming
            const delta = event.originalEvent.deltaY;

            // Adjust the zoom level
            if (delta < 0) {
                // Scroll up -> zoom in
                zoomLevel += zoomStep;
            } else {
                // Scroll down -> zoom out
                zoomLevel -= zoomStep;
            }

            // Constrain zoom level within the limits
            zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel));

            // Apply transform to the content
            content.css('transform', `scale(${zoomLevel}) translate(${currentX}px, ${currentY}px)`);
        }
    });

    // Panning functionality
    board.on('mousedown', function (event) {
        if (event.ctrlKey && event.which === 1) { // Check if Ctrl key and left mouse button are pressed
            isPanning = true;
            startX = event.pageX - currentX; // Calculate starting x-coordinate
            startY = event.pageY - currentY; // Calculate starting y-coordinate
            $(this).css('cursor', 'grabbing'); // Change cursor to indicate panning
            event.preventDefault(); // Prevent default drag behavior
        }
    });

    $(document).on('mousemove', function (event) {
        if (isPanning) {
            // Calculate new translation values
            currentX = (event.pageX - startX) * speedModifier;
            currentY = (event.pageY - startY) * speedModifier;

            // Apply translation while preserving the zoom scale
            content.css('transform', `scale(${zoomLevel}) translate(${currentX}px, ${currentY}px)`);
        }
    });

    $(document).on('mouseup', function () {
        if (isPanning) {
            isPanning = false;
            board.css('cursor', 'default'); // Reset cursor
        }
    });
});
