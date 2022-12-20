const GRID2PX_FACTOR = 5;

class TrafficModel {
    constructor(size, firstStreet) {
        // Model parameters
        this.size = size * GRID2PX_FACTOR;
        this.streetSize = 4;
        this.firstStreet = firstStreet;
        this.firstStreetOriginal = firstStreet;
        this.distanceBetweenStreets = 51;
        this.numberOfStreets = 5;

        // Storage for all vehicles and traffic lights
        this.vehicles = [];
        this.trafficLights = [];
        this.withBikeLane = false;

        // Parameters for moving and zooming the map
        this.cameraOffset = { x: 0, y: 0 };
        this.cameraZoom = 1;
        this.minZoom = 1;
        this.maxZoom = 10;
        this.scrollSensitivity = 0.0008;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.initialPinchDistance = null;
        this.lastZoom = this.cameraZoom;

        // Create canvas and add it to the DOM
        this.canvas = document.createElement("canvas");
        this.canvas.style =
            "width: 100%; max-width: 600px; border: 1px solid black; margin: 1rem 0 5rem;";
        const elements = document.getElementById("elements");
        elements.appendChild(this.canvas);

        // Create the context and the drawing controller:
        this.context = this.canvas.getContext("2d");

        // Register vent listeners for zooming and moving the map.
        this.canvas.addEventListener("mousedown", (e) => this.onPointerDown(e));
        this.canvas.addEventListener("touchstart", (e) =>
            this.handleTouch(e, this.onPointerDown)
        );
        this.canvas.addEventListener("mouseup", (e) => this.onPointerUp(e));
        this.canvas.addEventListener("touchend", (e) =>
            this.handleTouch(e, this.onPointerUp)
        );
        this.canvas.addEventListener("mousemove", (e) => this.onPointerMove(e));
        this.canvas.addEventListener("touchmove", (e) =>
            this.handleTouch(e, this.onPointerMove)
        );
        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            this.adjustZoom(e.deltaY * this.scrollSensitivity);
        });
        this.canvas.addEventListener("mouseleave", (e) => this.onPointerUp(e));

        this.imageBike = new Image();
        this.imageBike.src = "/local/TrafficGrid/frontend/bike.svg";
        this.imageCar = new Image();
        this.imageCar.src = "/local/TrafficGrid/frontend/car.svg";

        // Start draw cycle
        this.draw(this.context);
    }

    draw(ctx) {
        // Set canvas size
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        // Adjust for zoom and camera offset.
        ctx.translate(this.size / 2, this.size / 2);
        ctx.scale(this.cameraZoom, this.cameraZoom);
        ctx.translate(
            -this.size / 2 + this.cameraOffset.x,
            -this.size / 2 + this.cameraOffset.y
        );

        // Clear all visible contents
        ctx.clearRect(0, 0, this.size, this.size);

        // Draw street borders
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#666";

        // Draw street lines
        let k = this.firstStreet * GRID2PX_FACTOR;
        ctx.beginPath();
        for (let i = 0; i < this.numberOfStreets; i++) {
            // Draw left street borders
            ctx.moveTo(k, 0);
            ctx.lineTo(k, this.size);
            ctx.moveTo(0, k);
            ctx.lineTo(this.size, k);
            k += this.streetSize * GRID2PX_FACTOR;

            // Draw right street borders
            ctx.moveTo(k, 0);
            ctx.lineTo(k, this.size);
            ctx.moveTo(0, k);
            ctx.lineTo(this.size, k);
            k += this.distanceBetweenStreets * GRID2PX_FACTOR;
        }
        ctx.stroke();

        // Draw dashed lines
        let blockSize = this.distanceBetweenStreets + this.streetSize;
        k = (this.firstStreet + this.streetSize / 2) * GRID2PX_FACTOR;
        for (let i = 0; i < this.numberOfStreets; i++) {
            // Draw middle lines
            ctx.beginPath();
            ctx.setLineDash([2 * GRID2PX_FACTOR, 2 * GRID2PX_FACTOR]);
            ctx.lineDashOffset = 2 * GRID2PX_FACTOR;
            ctx.strokeStyle = "#666";
            ctx.moveTo(k, 0);
            ctx.lineTo(k, this.size);
            ctx.moveTo(0, k);
            ctx.lineTo(this.size, k);
            ctx.stroke();

            // Draw bike lanes
            if (this.withBikeLane) {
                ctx.beginPath();
                ctx.setLineDash([GRID2PX_FACTOR, GRID2PX_FACTOR]);
                ctx.lineDashOffset = 0;
                ctx.strokeStyle = "#d67d00";
                // horizontal lines
                ctx.moveTo(k - 2 * GRID2PX_FACTOR, 0);
                ctx.lineTo(k - 2 * GRID2PX_FACTOR, this.size);
                ctx.moveTo(k + 2 * GRID2PX_FACTOR, 0);
                ctx.lineTo(k + 2 * GRID2PX_FACTOR, this.size);

                // vertical lines
                ctx.moveTo(0, k - 2 * GRID2PX_FACTOR);
                ctx.lineTo(this.size, k - 2 * GRID2PX_FACTOR, this.size);
                ctx.moveTo(0, k + 2 * GRID2PX_FACTOR);
                ctx.lineTo(this.size, k + 2 * GRID2PX_FACTOR);
                ctx.stroke();
            }

            k += blockSize * GRID2PX_FACTOR;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Clear intersections
        for (let i = 0; i < this.numberOfStreets; i++) {
            for (let j = 0; j < this.numberOfStreets; j++) {
                ctx.clearRect(
                    (i * blockSize + this.firstStreet) * GRID2PX_FACTOR,
                    (j * blockSize + this.firstStreet) * GRID2PX_FACTOR,
                    this.streetSize * GRID2PX_FACTOR,
                    this.streetSize * GRID2PX_FACTOR
                );
            }
        }

        // Draw vehicles
        this.vehicles.forEach((vehicle) => {
            let x = vehicle.x;
            let y = vehicle.y;
            let image, size, color;

            if (vehicle.type === 0) {
                // Type = Car
                image = this.imageCar;
                color = "blue";
                size = 2;

                // Adjust grid position based on direction. The given coordinate represents the back-right corner of the car in direction of travel.
                switch (vehicle.dir) {
                    case 0: // UP
                        x -= 1;
                        y -= 1;
                        break;
                    case 1: // RIGHT
                        y -= 1;
                        break;
                    case 2: // DOWN
                        break;
                    case 3: // LEFT
                        x -= 1;
                        break;
                }
            } else if (vehicle.type === 1) {
                // Type = Bike
                image = this.imageBike;
                size = 1;
                color = "orange";
            }

            // Draw rectangle for the vehicle's boundary.
            size *= GRID2PX_FACTOR;
            ctx.fillStyle = color;
            ctx.fillRect(x * GRID2PX_FACTOR, y * GRID2PX_FACTOR, size, size);

            // Add rotated icon on top of the rectangle.
            ctx.save();
            ctx.translate(
                x * GRID2PX_FACTOR + size / 2,
                y * GRID2PX_FACTOR + size / 2
            );
            ctx.rotate(((-1 + vehicle.dir) * Math.PI) / 2);
            ctx.translate(
                -x * GRID2PX_FACTOR - size / 2,
                -y * GRID2PX_FACTOR - size / 2
            );
            ctx.drawImage(
                image,
                x * GRID2PX_FACTOR,
                y * GRID2PX_FACTOR,
                size,
                size
            );
            ctx.restore();
        });

        // Draw traffic lights
        this.trafficLights.forEach((light) => {
            // Lines for left <-> right traffic
            ctx.lineWidth = 3;
            ctx.strokeStyle = light.state === 1 ? "red" : "green";
            ctx.beginPath();
            ctx.moveTo(light.x * GRID2PX_FACTOR, light.y * GRID2PX_FACTOR);
            ctx.lineTo(
                light.x * GRID2PX_FACTOR,
                (light.y + this.streetSize) * GRID2PX_FACTOR
            );
            ctx.moveTo(
                (light.x + this.streetSize) * GRID2PX_FACTOR,
                light.y * GRID2PX_FACTOR
            );
            ctx.lineTo(
                (light.x + this.streetSize) * GRID2PX_FACTOR,
                (light.y + this.streetSize) * GRID2PX_FACTOR
            );
            ctx.stroke();

            // Lines for up <-> down traffic
            ctx.strokeStyle = light.state === 0 ? "red" : "green";
            ctx.beginPath();
            ctx.moveTo(light.x * GRID2PX_FACTOR, light.y * GRID2PX_FACTOR);
            ctx.lineTo(
                (light.x + this.streetSize) * GRID2PX_FACTOR,
                light.y * GRID2PX_FACTOR
            );
            ctx.moveTo(
                light.x * GRID2PX_FACTOR,
                (light.y + this.streetSize) * GRID2PX_FACTOR
            );
            ctx.lineTo(
                (light.x + this.streetSize) * GRID2PX_FACTOR,
                (light.y + this.streetSize) * GRID2PX_FACTOR
            );
            ctx.stroke();

            if (this.withBikeBox) {
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#666";
                ctx.beginPath();
                // left -> right
                ctx.moveTo(
                    (light.x - 1) * GRID2PX_FACTOR,
                    (light.y + this.streetSize / 2) * GRID2PX_FACTOR
                );
                ctx.lineTo(
                    (light.x - 1) * GRID2PX_FACTOR,
                    (light.y + this.streetSize - 1) * GRID2PX_FACTOR
                );
                // right -> left
                ctx.moveTo(
                    (light.x + this.streetSize + 1) * GRID2PX_FACTOR,
                    (light.y + 1) * GRID2PX_FACTOR
                );
                ctx.lineTo(
                    (light.x + this.streetSize + 1) * GRID2PX_FACTOR,
                    (light.y + this.streetSize / 2) * GRID2PX_FACTOR
                );
                // up -> down
                ctx.moveTo(
                    (light.x + 1) * GRID2PX_FACTOR,
                    (light.y - 1) * GRID2PX_FACTOR
                );
                ctx.lineTo(
                    (light.x + this.streetSize / 2) * GRID2PX_FACTOR,
                    (light.y - 1) * GRID2PX_FACTOR
                );
                // down -> up
                ctx.moveTo(
                    (light.x + this.streetSize / 2) * GRID2PX_FACTOR,
                    (light.y + this.streetSize + 1) * GRID2PX_FACTOR
                );
                ctx.lineTo(
                    (light.x + this.streetSize - 1) * GRID2PX_FACTOR,
                    (light.y + this.streetSize + 1) * GRID2PX_FACTOR
                );
                ctx.stroke();
            }
        });

        // Repeat the draw cycle. This enables scrolling, zooming and more
        window.requestAnimationFrame(() => this.draw(ctx));
    }

    getEventLocation(e) {
        // Return x and y coordinate of a mouse or touch event
        if (e.touches && e.touches.length == 1) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.clientX && e.clientY) {
            return { x: e.clientX, y: e.clientY };
        } else {
            return { x: 0, y: 0 };
        }
    }

    onPointerDown(e) {
        // Mouse is clicked. Start translating the map as the pointer moves.
        this.isDragging = true;
        this.dragStart.x =
            this.getEventLocation(e).x / this.cameraZoom - this.cameraOffset.x;
        this.dragStart.y =
            this.getEventLocation(e).y / this.cameraZoom - this.cameraOffset.y;
    }

    onPointerUp(_) {
        // Mouse is not clicked or not over the target anymore.
        this.isDragging = false;
        this.initialPinchDistance = null;
        this.lastZoom = this.cameraZoom;
    }

    onPointerMove(e) {
        // Translate the map, when the mouse button is clicked.
        if (!this.isDragging) {
            return;
        }

        this.setCameraOffset(
            this.getEventLocation(e).x / this.cameraZoom - this.dragStart.x,
            this.getEventLocation(e).y / this.cameraZoom - this.dragStart.y
        );
    }

    setCameraOffset(newX, newY) {
        // Calculate maximum camera offset value, in order to only show grid without border.
        const maxOffset =
            (this.size * (this.cameraZoom - 1)) / (2 * this.cameraZoom);

        newX = Math.sign(newX) * Math.min(maxOffset, Math.abs(newX));
        newY = Math.sign(newY) * Math.min(maxOffset, Math.abs(newY));

        this.cameraOffset.x = newX;
        this.cameraOffset.y = newY;
    }

    handleTouch(e, singleTouchHandler) {
        // Handle touch events, which can be either moving or zooming
        e.preventDefault();
        if (e.touches.length == 1) {
            singleTouchHandler.call(this, e);
        } else if (e.type == "touchmove" && e.touches.length == 2) {
            this.isDragging = false;
            this.handlePinch(e);
        }
    }

    handlePinch(e) {
        e.preventDefault();

        let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        let currentDistance =
            (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2;

        if (this.initialPinchDistance == null) {
            this.initialPinchDistance = currentDistance;
        } else {
            this.adjustZoom(null, currentDistance / this.initialPinchDistance);
        }
    }

    adjustZoom(zoomAmount, zoomFactor) {
        if (this.isDragging) {
            return;
        }

        // Adjust the zoom factor by the given amount or factor.
        if (zoomAmount) {
            this.cameraZoom -= zoomAmount;
        } else if (zoomFactor) {
            this.cameraZoom = zoomFactor * this.lastZoom;
        }

        this.cameraZoom = Math.min(this.cameraZoom, this.maxZoom);
        this.cameraZoom = Math.max(this.cameraZoom, this.minZoom);

        // Prevent moving out of the map.
        this.setCameraOffset(this.cameraOffset.x, this.cameraOffset.y);
    }

    render(data) {
        this.withBikeLane = data.with_bike_lane;
        this.withBikeBox = data.with_bike_box;
        this.vehicles = data.vehicles;
        this.trafficLights = data.traffic_lights;

        if (this.withBikeLane) {
            this.streetSize = 6;
            this.firstStreet = this.firstStreetOriginal - 1;
            this.distanceBetweenStreets = 50;
        } else {
            this.streetSize = 4;
            this.firstStreet = this.firstStreetOriginal;
            this.distanceBetweenStreets = 51;
        }
    }

    reset() {
        this.vehicles = [];
        this.trafficLights = [];
    }
}

window.TrafficModel = TrafficModel;
