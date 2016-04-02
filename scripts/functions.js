// ! Pool

function Pool(constructor)
{
    this.constructor = constructor;

    this.freeList = [];
}

function poolAlloc(pool)
{
    var object;
    if (pool.freeList.length == 0)
    {
        object = new pool.constructor();
    }
    else
    {
        object = pool.freeList.pop();
    }
    return object;
}

function poolFree(pool, object)
{
    pool.freeList.push(object);
}

// ! Vectors

var v2 = {};

v2.pool = new Pool(function()
{
    return new Float32Array(2);
});

v2.alloc = function()
{
    return poolAlloc(v2.pool);
}

v2.free = function(a)
{
    poolFree(v2.pool, a);
}

v2.create = function(x, y)
{
    var out = new Float32Array(2);
    out[0] = x;
    out[1] = y;
    return out;
}

v2.clone = function(a)
{
    var out = new Float32Array(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
}

v2.set = function(out, x, y)
{
    out[0] = x;
    out[1] = y;
    return out;
}

v2.copy = function(out, a)
{
    out[0] = a[0];
    out[1] = a[1];
    return out;
}

v2.add = function(out, a, b)
{
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
}

v2.subtract = function(out, a, b)
{
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
}

v2.negate = function(out, a)
{
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
}

v2.scale = function(out, a, t)
{
    out[0] = t * a[0];
    out[1] = t * a[1];
    return out;
}

v2.scaleAndAdd = function(out, a, b, t)
{
    out[0] = a[0] + b[0] * t;
    out[1] = a[1] + b[1] * t;
    return out;
}

v2.dot = function(a, b)
{
    return a[0] * b[0] + a[1] * b[1];
}

v2.setPolar = function(out, radius, angle)
{
    var x = radius * Math.cos(angle);
    var y = radius * Math.sin(angle);
    return v2.set(out, x, y);
}

v2.square = function(a)
{
    return a[0] * a[0] + a[1] * a[1];
}

v2.length = function(a)
{
    return Math.sqrt(v2.square(a));
}

v2.normalize = function(out, a)
{
    var length = v2.length(a);
    v2.scale(out, a, 1 / length);
    return out;
}

v2.projectOntoNormal = function(out, a, normal)
{
    var length = v2.dot(a, normal);
    v2.scale(out, normal, length);
    return out;
}

v2.rotateCCW = function(out, a)
{
    out[0] = -a[1];
    out[1] = a[0];
    return out;
}

v2.rotateCW = function(out, a)
{
    out[0] = a[1];
    out[1] = -a[0];
    return out;
}

v2.outer = function(a, b)
{
    return a[0] * b[1] - a[1] * b[0];
}

// ! Generally useful

function combineWithDefaults(opts, defaults)
{
    for (var key in defaults)
    {
        if (!opts.hasOwnProperty(key))
        {
            opts[key] = defaults[key];
        }
        else if (typeof opts[key] === 'object')
        {
            combineWithDefaults(opts[key], defaults[key]);
        }
    }
}

function arrayLast(array)
{
    return array[array.length - 1];
}

function arrayMinIndex(array, f)
{
    var minimum = Number.MAX_VALUE;
    var minimumIndex = -1;
    for (var i = 0; i < array.length; i++) {
        var value = f(array[i]);
        if (value < minimum)
        {
            minimum = value;
            minimumIndex = i;
        }
    }
    return minimumIndex;
}

// ! DOM stuff

function createAndAppend(elementType, parent)
{
    var element = document.createElement(elementType);
    parent.appendChild(element);
    return element;
}

function hideElement(element)
{
    element.style.display = "none";
}

function showElement(element)
{
    element.style.display = "block";
}

// ! Graphs/Plots

function createGraph(div, label)
{
    var graph = {};

    var span = createAndAppend("div", div);
    span.innerHTML = label;
    var canvas = createAndAppend("canvas", div);
    canvas.width = 400;
    canvas.height = 200;

    graph.div = div;
    graph.renderer = createRenderer(canvas);

    graph.curves = [];
    graph.bars = [];
    graph.limits = {
        xMin: "auto",
        xMax: "auto",
        yMin: "auto",
        yMax: "auto",
    };

    return graph;
}

function addCurve(graph, opts)
{
    combineWithDefaults(opts,
    {
        color: colors.black,
    });

    var curve = {
        pointCount: Math.min(opts.x.length, opts.y.length),
        xs: opts.x,
        ys: opts.y,
        color: opts.color,
    };

    graph.curves.push(curve);
}

function addBars(graph, opts)
{
    combineWithDefaults(opts,
    {
        bars: []
    });

    graph.bars = graph.bars.concat(opts.bars);
}

function setGraphLimits(graph, limits)
{
    for (var key in limits)
    {
        graph.limits[key] = limits[key];
    }
}

function maximumBy(array, f)
{
    var max = -Number.MAX_VALUE;
    for (var i = 0; i < array.length; i++)
    {
        var x = f(array[i]);

        if (x > max)
        {
            max = x;
        }
    }
    return max;
}

function updateAutoLimits(autoLimits, x, y)
{
    if (x < autoLimits.xMin)
    {
        autoLimits.xMin = x;
    }
    if (x > autoLimits.xMax)
    {
        autoLimits.xMax = x;
    }

    if (y < autoLimits.yMin)
    {
        autoLimits.yMin = y;
    }
    if (y > autoLimits.yMax)
    {
        autoLimits.yMax = y;
    }
}

function drawGraph(graph)
{
    // Figure out limits

    var autoLimits = {
        xMin: Number.MAX_VALUE,
        xMax: -Number.MAX_VALUE,
        yMin: Number.MAX_VALUE,
        yMax: -Number.MAX_VALUE,
    }
    for (var curveIndex = 0; curveIndex < graph.curves.length; curveIndex++)
    {
        var curve = graph.curves[curveIndex];
        for (var i = 0; i < curve.pointCount; i++)
        {
            var x = curve.xs[i];
            var y = curve.ys[i];
            updateAutoLimits(autoLimits, x, y);
        }
    }

    for (var barIndex = 0; barIndex < graph.bars.length; barIndex++)
    {
        var bar = graph.bars[barIndex];
        updateAutoLimits(autoLimits, bar.start, 0);
        updateAutoLimits(autoLimits, bar.end, bar.value);
    }

    var limits = {};

    for (var key in graph.limits)
    {
        if (graph.limits[key] == "auto")
        {
            limits[key] = autoLimits[key];
        }
        else
        {
            limits[key] = graph.limits[key];
        }
    }

    var paddingFactor = 0.05;
    var minimumPadding = 0.00001;
    var xPadding = Math.max(paddingFactor * (limits.xMax - limits.xMin), minimumPadding);
    var yPadding = Math.max(paddingFactor * (limits.yMax - limits.yMin), minimumPadding);

    setLeftTopRightBottom(graph.renderer.bounds,
        limits.xMin - xPadding,
        limits.yMax + yPadding,
        limits.xMax + xPadding,
        limits.yMin - yPadding
    );

    updateRendererBounds(graph.renderer);

    // Clear and draw

    clearRenderer(graph.renderer);

    for (var curveIndex = 0; curveIndex < graph.curves.length; curveIndex++)
    {
        var curve = graph.curves[curveIndex];
        drawTrajectoryUnzipped(graph.renderer, curve.xs, curve.ys, curve.color);
    }
    if (graph.bars.length > 0)
    {
        var barWidth = (limits.xMax - limits.xMin) / graph.bars.length;
        for (var barIndex = 0; barIndex < graph.bars.length; barIndex++)
        {
            var bar = graph.bars[barIndex];
            var barRect = setLeftTopRightBottom(new Rectangle(), bar.start, 0, bar.end, bar.value);
            drawRectangle(graph.renderer, barRect, bar.color);
        }
    }

    // Reset state

    graph.curves = [];
    graph.bars = [];
}

// ! Measurement regions

function createMeasurementRegion()
{
    var region = {};
    region.bounds = new Rectangle();
    region.color = colors.black;
    region.overlayColor = colors.transparent;
    region.measurements = {
        time: [],
        energy: [],
        temperature: [],
        count: [],
    }
    return region;
}

function setColdHotRegions(simulation)
{
    var leftRegion = createMeasurementRegion();
    copyRectangle(leftRegion.bounds, simulation.leftRect);
    leftRegion.color = colors.blue;
    leftRegion.overlayColor = withAlpha(colors.blue, 0.2);

    var rightRegion = createMeasurementRegion();
    copyRectangle(rightRegion.bounds, simulation.rightRect);
    rightRegion.color = colors.red;
    rightRegion.overlayColor = withAlpha(colors.red, 0.2);

    simulation.measurementRegions = [leftRegion, rightRegion];
}

// ! Constants

var tau = 2 * Math.PI;

// ! Particle object

var Particle = function()
{
    this.position = v2.create(0, 0);
    this.velocity = v2.create(0, 0);
    this.acceleration = v2.create(0, 0);
    this.deltaPosition = v2.create(0, 0);

    this.color = colors.black;
    this.bounds = new Rectangle();
    this.radius = 1;
    this.mass = 1;
}

Particle.prototype.updateBounds = function()
{
    this.bounds.setCenterWidthHeight(this.position, radiusScaling * 2, radiusScaling * 2);
    return this.bounds;
}

// ! Initialization

function groupedPosition(simulation, particleIndex)
{
    var boxBounds = simulation.boxBounds;
    var smallCenteredRect = new Rectangle().setCenterWidthHeight(
        boxBounds.center, boxBounds.width / 5, boxBounds.height / 5
    );
    return randomPointInRect(smallCenteredRect);
}

function uniformPosition(simulation, particleIndex)
{
    // TODO: use poisson disk sampling to avoid collisions?
    return randomPointInRect(simulation.boxBounds);
}

function halvesPosition(simulation, particleIndex)
{
    if (particleIndex % 2 == 0)
    {
        return randomPointInRect(simulation.leftRect);
    }
    else
    {
        return randomPointInRect(simulation.rightRect);
    }
}

var triangularLatticePosition = function()
{

    var latticeX = v2.create(0, 0);
    var latticeY = v2.create(0, 0);

    return function(simulation, particleIndex)
    {
        // NOTE: this is the formula for triangular numbers inverted
        var triangularNumber = Math.floor((Math.sqrt(8 * particleIndex + 1) - 1) / 2);
        var rest = particleIndex - triangularNumber * (triangularNumber + 1) / 2;
        var integerX = rest;
        var integerY = triangularNumber - rest;
        var latticeSpacing = 2 * simulation.parameters.radiusScaling * simulation.parameters.separationFactor;
        var overallRotation = -tau / 12;
        v2.setPolar(latticeX, latticeSpacing * integerX, overallRotation);
        v2.setPolar(latticeY, latticeSpacing * integerY, overallRotation + tau / 6);
        return v2.add(v2.create(0, 0), latticeX, latticeY);
    }
}();

var rectangularLatticePosition = function()
{
    var latticeX = v2.create(0, 0);
    var latticeY = v2.create(0, 0);

    return function(simulation, particleIndex)
    {
        if (particleIndex == 0)
        {
            return v2.create(0, 0);
        }
        var layer = Math.floor((Math.sqrt(particleIndex) + 1) / 2);
        var rest = particleIndex - squared(2 * layer - 1);
        var quadrant = Math.floor(rest / (2 * layer));
        var integerX = layer;
        var integerY = (rest % (2 * layer)) - layer + 1;
        var latticeSpacing = 2 * simulation.parameters.radiusScaling * simulation.parameters.separationFactor;
        var rotationAngle = quadrant * tau / 4;
        v2.setPolar(latticeX, latticeSpacing * integerX, rotationAngle);
        v2.setPolar(latticeY, latticeSpacing * integerY, rotationAngle + tau / 4);
        return v2.add(v2.create(0, 0), latticeX, latticeY);
    }
}();

var hexagonalLatticePosition = function()
{

    var latticeX = v2.create(0, 0);
    var latticeY = v2.create(0, 0);

    return function(simulation, particleIndex)
    {
        // NOTE: this adds the particles in a spiral by figuring out their coordinates in
        // one of 6 triangular lattices
        if (particleIndex == 0)
        {
            return v2.create(0, 0);
        }
        var k = particleIndex - 1;
        var layer = Math.floor((Math.sqrt(8 * (k / 6) + 1) - 1) / 2) + 1; // NOTE: 1-indexed
        var rest = k - 6 * layer * (layer - 1) / 2;
        var triangleIndex = Math.floor(rest / layer);
        var integerX = layer;
        var integerY = rest % layer;
        var latticeSpacing = 2 * simulation.parameters.radiusScaling * simulation.parameters.separationFactor;
        var rotationAngle = triangleIndex * tau / 6;
        v2.setPolar(latticeX, latticeSpacing * integerX, rotationAngle);
        var shape = 2; // 1: spiral, 2: hexagon
        v2.setPolar(latticeY, latticeSpacing * integerY, rotationAngle + shape * tau / 6);
        return v2.add(v2.create(0, 0), latticeX, latticeY);
    }
}();

function randomVelocity(maxSpeed)
{
    var speed = randomInInterval(0, maxSpeed);
    var direction = randomUnitVector();
    return v2.scale(direction, direction, speed);
}

function randomUnitVector()
{
    var angle = randomInInterval(0, tau);
    return v2.create(Math.cos(angle), Math.sin(angle));
}

function uniformVelocity(simulation, particleIndex)
{
    return randomVelocity(simulation.parameters.maxInitialSpeed);
}



function identicalVelocity(simulation, particleIndex)
{
    return v2.create(0, -simulation.parameters.maxInitialSpeed);
}

function twoColors(simulation, particleIndex)
{
    if (particleIndex % 2 == 0)
    {
        return colors.black;
    }
    else
    {
        return colors.red;
    }
}

// ! particle generators

function uniformParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();

    // TODO: generalize this
    do {
        particle.position = uniformPosition(simulation, particleIndex);
    }
    while (isColliding(simulation, particle))

    particle.velocity = uniformVelocity(simulation, particleIndex);
    return particle;
}

function groupedParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = groupedPosition(simulation, particleIndex);
    particle.velocity = uniformVelocity(simulation, particleIndex);
    return particle;
}

function fallingParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = groupedPosition(simulation, particleIndex);
    particle.velocity = identicalVelocity(simulation, particleIndex);
    return particle;
}

function twoColorParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = halvesPosition(simulation, particleIndex);
    particle.velocity = uniformVelocity(simulation, particleIndex);
    particle.color = twoColors(simulation, particleIndex);
    return particle;
}

function latticeParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = hexagonalLatticePosition(simulation, particleIndex);
    return particle;
}


function billiardsParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    if (particleIndex == 0)
    {
        particle.position = v2.create(-0.5, 0);
    }
    else
    {
        particle.position = triangularLatticePosition(simulation, particleIndex - 1);
        v2.add(particle.position, particle.position, v2.create(0.3, 0))
    }
    return particle;
}

function updateParticleCount(simulation)
{
    var newParticleCount = simulation.parameters.particleCount;
    if (newParticleCount == simulation.particles.length)
    {
        return;
    }
    else if (newParticleCount < simulation.particles.length)
    {
        simulation.particles.splice(newParticleCount, Number.MAX_VALUE);
    }
    else
    {
        for (var particleIndex = simulation.particles.length; particleIndex < newParticleCount;
            ++particleIndex)
        {
            simulation.particles.push(simulation.particleGenerator(simulation, particleIndex))
        }
        // TODO: move particles out of each other so that no overlaps occur
    }
}

function addParticle(simulation, position)
{
    var inside = doesRectContainPoint(simulation.boxBounds, position);
    if (inside)
    {
        var particleIndex = simulation.particles.length;
        var particle = simulation.particleGenerator(simulation, particleIndex);
        particle.position = position;
        simulation.particles.push(particle);
        simulation.parameters.particleCount += 1;
    }
}

function isColliding(simulation, particle)
{
    var hitParticle = pickParticle(simulation, particle.position, particle.radius);
    if (hitParticle >= 0)
    {
        return true;
    }
    for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++)
    {
        var wall = simulation.walls[wallIndex];
        var collision = wallParticleCollision(simulation, wall, particle);
        if (collision.overlap > 0)
        {
            return true;
        }
    }
}

function removeParticle(simulation, particleIndex)
{
    simulation.particles.splice(particleIndex, 1);
    simulation.parameters.particleCount -= 1;
}

function worldFromPage(renderer, pagePosition)
{
    var canvasBounds = renderer.canvas.getBoundingClientRect();
    var canvasX = pagePosition[0] - canvasBounds.left;
    var canvasY = pagePosition[1] - canvasBounds.top;
    return worldFromCanvas(renderer, v2.create(canvasX, canvasY));
}

function square(x)
{
    return x * x;
}

function pickParticle(simulation, pickPosition, extraRadius)
{
    extraRadius = extraRadius || 0;

    for (var particleIndex = 0; particleIndex < simulation.particles.length;
        ++particleIndex)
    {
        var particle = simulation.particles[particleIndex];
        var squaredRadius = square((particle.radius + extraRadius) * simulation.parameters.radiusScaling);
        var between = v2.create();
        v2.subtract(between, pickPosition, particle.position);
        var inside = v2.square(between) < squaredRadius;
        if (inside)
        {
            return particleIndex;
        }
    }
    return -1;
}

var simulationCount = 0;

function createSimulation(opts)
{
    var simulation = {};

    combineWithDefaults(opts,
    {
        width: 400,
        height: 400,
        controls: ["resetButton"],
        visualizations: [],
        measurementRegions: [],
        walls: [],
        particleGenerator: latticeParticleGenerator,
        parameters:
        {
            maxInitialSpeed: 0.1,
            collisionEnabled: false,
            pressureWindowSize: 1000,
            quadtreeEnabled: true,
            frameDuration: 1000 / 60,
            deltaTemperature: 1,
            gravityAcceleration: 0,
            simulationSpeed: 1,
            particleCount: 91,
            radiusScaling: 0.08,
            friction: 0,
            bondEnergy: 0.0001,
            measurementWindowLength: 100,
            separationFactor: 1.2,
        },
        customUpdate: function(simulation) {},
    });

    simulation.running = true;
    simulation.time = 0;
    simulation.times = [];
    simulation.pausedByUser = false;
    simulation.previousTimestamp = 0;
    simulation.timeLeftToSimulate = 0;
    simulation.isFirstFrameAfterPause = true;

    simulation.particles = [];
    simulation.particleGenerator = opts.particleGenerator;

    simulation.quadTree = undefined;

    simulation.boxBounds = new Rectangle();
    simulation.leftRect = new Rectangle();
    simulation.rightRect = new Rectangle();

    simulation.parameters = opts.parameters;
    simulation.initialParameters = {};
    combineWithDefaults(simulation.initialParameters, opts.parameters);

    simulation.customUpdate = opts.customUpdate;

    // TODO: more than one trajectory
    simulation.trajectoryEnabled = false;
    simulation.trajectory = [];

    // ! set up HTML elements
    simulation.id = "simulation" + simulationCount;
    simulationCount += 1;

    document.currentScript.insertAdjacentHTML("afterEnd", '<div id="' + simulation.id + '"></div>');
    simulation.div = document.getElementById(simulation.id);
    simulation.div.setAttribute("class", "simulation");

    simulation.leftDiv = createAndAppend("div", simulation.div);
    simulation.rightDiv = createAndAppend("div", simulation.div);

    simulation.canvas = createAndAppend("canvas", simulation.leftDiv);
    simulation.canvas.setAttribute("width", opts.width);
    simulation.canvas.setAttribute("height", opts.height);
    simulation.canvas.setAttribute("class", "simulation_canvas");

    simulation.controlsDiv = createAndAppend("div", simulation.leftDiv);
    simulation.buttonDiv = createAndAppend("div", simulation.controlsDiv);
    simulation.sliderDiv = createAndAppend("div", simulation.controlsDiv);
    simulation.checkboxDiv = createAndAppend("div", simulation.controlsDiv);

    // ! Keyboard stuff

    simulation.downKeys = [];

    document.addEventListener("keydown", function(event)
    {
        var downKey = String.fromCharCode(event.keyCode).toLowerCase();
        simulation.downKeys.push(downKey);
    })

    document.addEventListener("keyup", function(event)
    {
        var releasedKey = String.fromCharCode(event.keyCode).toLowerCase();
        simulation.downKeys = simulation.downKeys.filter(function(key)
        {
            return key != releasedKey;
        });
    })

    // ! Mouse stuff

    simulation.mouse = {
        active: false,
        worldPosition: v2.create(0, 0),
        leftButton:
        {
            down: false,
            transitionCount: 0,
        },
        rightButton:
        {
            down: false,
            transitionCount: 0,
        },
        mode: "",
        activeParticleIndex: -1,
        billiardCue:
        {
            visible: false,
            start: v2.create(0, 0),
            end: v2.create(0, 0),
            strength: 1,
            length: 0.8,
        }
    }

    function updateMouseButton(button, willBeDown)
    {
        button.transitionCount += button.down ^ willBeDown;
        button.down = willBeDown;
    }

    function updateMouseFromEvent(event)
    {
        if (simulation.mouse.active)
        {
            simulation.mouse.worldPosition = worldFromPage(simulation.renderer, v2.create(event.clientX, event.clientY));
            updateMouseButton(simulation.mouse.leftButton, (event.buttons & 1) != 0);
            updateMouseButton(simulation.mouse.rightButton, (event.buttons & 2) != 0);
            event.preventDefault();
        }
    }

    // NOTE: only listen to mouse events that start on this canvas
    simulation.canvas.addEventListener("mousedown", function(event)
    {
        simulation.mouse.active = true;
        updateMouseFromEvent(event);
    });
    document.addEventListener("mouseup", function(event)
    {
        updateMouseFromEvent(event);
        simulation.mouse.active = false;
    });
    document.addEventListener("mousemove", updateMouseFromEvent);

    // ! Pause when simulation is not visible

    function pauseIfHidden(event)
    {
        var divBounds = simulation.div.getBoundingClientRect();

        var isAboveViewport = divBounds.bottom < 0;
        var isBelowViewport = divBounds.top > window.innerHeight;

        var isAutoPaused = document.hidden || isAboveViewport || isBelowViewport;

        if (isAutoPaused)
        {
            if (simulation.requestFrameId)
            {
                window.cancelAnimationFrame(simulation.requestFrameId);
                simulation.requestFrameId = undefined;
            }
        }
        else
        {
            if (!simulation.requestFrameId)
            {
                simulation.isFirstFrameAfterPause = true;
                simulation.requestFrameId = window.requestAnimationFrame(simulation.updateFunction);
            }
        }
    }

    document.addEventListener('visibilitychange', pauseIfHidden);
    document.addEventListener("scroll", pauseIfHidden);
    document.addEventListener("resize", pauseIfHidden);
    window.addEventListener("load", pauseIfHidden);

    // TODO: pause when window loses focus? (blur, focus events)

    function createSlider(opts)
    {
        combineWithDefaults(opts,
        {
            label: name,
            minLabel: String(opts.min),
            maxLabel: String(opts.max),
            snapBack: false,
            function: function(x)
            {
                return x;
            },
        });

        var initialValue = simulation.parameters[opts.name];

        // set up slider element

        var slider = document.createElement("input");
        slider.setAttribute("id", simulation.id + "_" + opts.name)
        slider.setAttribute("type", "range");
        slider.setAttribute("value", initialValue);
        slider.setAttribute("min", opts.min);
        slider.setAttribute("max", opts.max);
        var step = opts.step || (opts.max - opts.min) / 1000;
        slider.setAttribute("step", step);

        // set up presentation elements

        var p = createAndAppend("p", simulation.sliderDiv);
        p.appendChild(document.createTextNode(opts.label));
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(opts.minLabel));
        p.appendChild(slider);
        p.appendChild(document.createTextNode(opts.maxLabel));

        // set up callbacks

        slider.addEventListener("input", function()
        {
            simulation.parameters[opts.name] = opts.function(Number(this.value));
        });

        if (opts.snapBack)
        {
            slider.addEventListener("change", function()
            {
                this.value = initialValue;
                simulation.parameters[opts.name] = opts.function(initialValue);
            });
        }

        hideElement(p);

        simulation.controls[opts.name] = p;
        return p;
    }

    function createCheckbox(opts)
    {
        combineWithDefaults(opts,
        {
            label: name
        });

        var span = createAndAppend("span", simulation.checkboxDiv)

        var label = createAndAppend("label", span);
        var checkbox = createAndAppend("input", span);
        checkbox.setAttribute("type", "checkbox");
        var checkboxId = simulation.id + "_" + opts.name;
        checkbox.setAttribute("id", checkboxId);
        checkbox.setAttribute("name", opts.name);
        checkbox.checked = simulation.parameters[opts.name];
        label.setAttribute("for", checkboxId);
        label.innerHTML = opts.label;

        checkbox.addEventListener("change", function()
        {
            simulation.parameters[opts.name] = this.checked;
        });

        hideElement(span);
        simulation.controls[opts.name] = span;
        return span;
    }

    function createButton(opts)
    {
        var button = createAndAppend("input", simulation.buttonDiv);
        button.setAttribute("type", "button");
        button.setAttribute("value", opts.label);
        button.addEventListener("click", opts.callback);
        hideElement(button);
        simulation.controls[opts.name] = button;
        return button;
    }

    // ! setup UI

    simulation.controls = {};

    // sliders

    createSlider(
    {
        name: "deltaTemperature",
        label: "Control temperature:",
        min: 0.97,
        minLabel: "Colder",
        max: 1.03,
        maxLabel: "Warmer",
        snapBack: true,
    });
    createSlider(
    {
        name: "simulationSpeed",
        label: "Control time:",
        min: -1,
        minLabel: "Backward",
        max: 1,
        maxLabel: "Forward",
    });
    createSlider(
    {
        name: "particleCount",
        label: "Number of particles:",
        min: 0,
        minLabel: "0",
        max: 225,
        maxLabel: "225",
        step: 1
            // TODO: make this exponential?
    });
    createSlider(
    {
        name: "radiusScaling",
        label: "Particle size:",
        min: 0.01,
        minLabel: "Tiny",
        max: 0.1,
        maxLabel: "Huge",
    });
    createSlider(
    {
        name: "gravityAcceleration",
        label: "Gravity:",
        min: 0,
        minLabel: "None",
        max: 2e-4,
        maxLabel: "Strong",
    });
    createSlider(
    {
        name: "boxSize",
        label: "Box Size:",
        min: 20,
        minLabel: "Tiny",
        max: 1000,
        maxLabel: "Huge",
    });
    createSlider(
    {
        name: "friction",
        label: "Friction:",
        min: -0.2,
        minLabel: "Negative?",
        max: 1,
        maxLabel: "A lot",
    });

    // checkboxes

    createCheckbox(
    {
        name: "quadtreeEnabled",
        label: "Quadtree",
    });
    createCheckbox(
    {
        name: "trajectoryEnabled",
        label: "Draw trajectory",
    });

    // buttons

    createButton(
    {
        name: "resetButton",
        label: "Reset",
        callback: function()
        {
            resetSimulation(simulation);
        }
    });
    createButton(
    {
        name: "playPauseButton",
        label: "Play/Pause",
        callback: function()
        {
            simulation.pausedByUser = !simulation.pausedByUser;
        },
    });
    createButton(
    {
        name: "addRandomParticleButton",
        label: "Add random particle",
        callback: function()
        {
            simulation.parameters.particleCount += 1;
        }
    });
    createButton(
    {
        name: "reverseTime",
        label: "Reverse time",
        callback: function()
        {
            simulation.parameters.simulationSpeed *= -1;
        }
    });

    for (var i = 0; i < opts.controls.length; i++)
    {
        showElement(simulation.controls[opts.controls[i]]);
    }

    // ! visualization

    simulation.visualizationDiv = createAndAppend("div", simulation.rightDiv);
    simulation.visualizations = {
        energy: createGraph(createAndAppend("div", simulation.visualizationDiv), "Energy"),
        temperature: createGraph(createAndAppend("div", simulation.visualizationDiv), "Temperature"),
        counts: createGraph(createAndAppend("div", simulation.visualizationDiv), "Counts"),
        countsHistogram: createGraph(createAndAppend("div", simulation.visualizationDiv), "Counts"),
        entropy: createGraph(createAndAppend("div", simulation.visualizationDiv), "Entropy"),
        probability: createGraph(createAndAppend("div", simulation.visualizationDiv), "Probability"),
    }
    simulation.timeSeries = [
        simulation.visualizations.energy,
        simulation.visualizations.temperature,
        simulation.visualizations.counts,
        simulation.visualizations.entropy,
        simulation.visualizations.probability,
    ];
    simulation.histograms = [simulation.visualizations.countHistogram];

    for (var key in simulation.visualizations)
    {
        hideElement(simulation.visualizations[key].div);
    }

    for (var i = 0; i < opts.visualizations.length; i++)
    {
        showElement(simulation.visualizations[opts.visualizations[i]].div);
    }


    simulation.renderer = createRenderer(simulation.canvas);

    // Retina stuff
    // TODO: internal resolution needs to be separate variable so that input works 
    // on retina
    var canvasWidth = simulation.canvas.width;
    var canvasHeight = simulation.canvas.height;

    simulation.canvas.style.width = canvasWidth + "px";
    simulation.canvas.style.height = canvasHeight + "px";

    var devicePixelRatio = window.devicePixelRatio || 1;
    simulation.canvas.width = canvasWidth * devicePixelRatio;
    simulation.canvas.height = canvasHeight * devicePixelRatio;

    // ! boxes

    var aspectRatio = simulation.canvas.width / simulation.canvas.height;
    var origin = v2.create(0, 0);

    setCenterWidthHeight(
        simulation.renderer.bounds,
        origin, 2 * aspectRatio, 2
    );

    updateRendererBounds(simulation.renderer);

    var boxBounds = simulation.boxBounds;
    setCenterWidthHeight(boxBounds,
        origin, 2 * aspectRatio, 2
    );

    setLeftTopRightBottom(simulation.rightRect,
        boxBounds.center[0], boxBounds.top,
        boxBounds.right, boxBounds.bottom);
    setLeftTopRightBottom(simulation.leftRect,
        boxBounds.left, boxBounds.top,
        boxBounds.center[0], boxBounds.bottom);

    simulation.quadTree = new Quadtree(boxBounds);

    var b = simulation.boxBounds;
    var corners = [
        v2.create(b.left, b.bottom),
        v2.create(b.right, b.bottom),
        v2.create(b.right, b.top),
        v2.create(b.left, b.top),
    ];

    // Walls

    simulation.walls = opts.walls;

    for (var i = 0; i < corners.length; i++)
    {
        simulation.walls.push(
        {
            start: corners[i],
            end: corners[(i + 1) % corners.length]
        });
    }

    // ! Measurements


    if (opts.measurementRegions.length > 0)
    {
        simulation.measurementRegions = opts.measurementRegions;
    }
    else
    {
        var totalRegion = createMeasurementRegion();
        copyRectangle(totalRegion.bounds, simulation.boxBounds);
        simulation.measurementRegions = [totalRegion];
    }
    simulation.entropy = [];
    simulation.probability = [];

    // ! Start simulation

    simulation.updateFunction = function(timestamp)
    {
        updateSimulation(simulation.updateFunction, simulation, timestamp);
    };

    simulation.requestFrameId = window.requestAnimationFrame(simulation.updateFunction);

    return simulation;
}

function resetSimulation(simulation)
{
    simulation.parameters.particleCount = 0;
    updateParticleCount(simulation);

    simulation.parameters = {};
    combineWithDefaults(simulation.parameters, simulation.initialParameters);

    updateParticleCount(simulation);
}

function lennardJonesEnergy(invDistance, bondEnergy, separation)
{
    // TODO: truncate and shift, see wikipedia
    var a = separation * invDistance;
    var a6 = Math.pow(a, 6);
    var shape = a6 * a6 - 2 * a6;
    return bondEnergy * shape;
}

function lennardJonesForce(invDistance, bondEnergy, separation)
{
    var a = separation * invDistance;
    var a6 = Math.pow(a, 6);
    var shape = 12 * invDistance * (a6 * a6 - a6);
    return bondEnergy * shape;
}

// ! Colors

colors = {};

function addColor(color)
{
    colors[color.name] = color;
}

addColor(
{
    name: "blue",
    rgba: [0, 0, 1, 1],
});

addColor(
{
    name: "red",
    rgba: [1, 0, 0, 1],
});

addColor(
{
    name: "green",
    rgba: [0, 1, 0, 1],
});

addColor(
{
    name: "yellow",
    rgba: [1, 0.8, 0, 1],
});

addColor(
{
    name: "black",
    rgba: [0, 0, 0, 1],
})

addColor(
{
    name: "white",
    rgba: [0, 0, 0, 1],
})

addColor(
{
    name: "gray",
    rgba: [0.5, 0.5, 0.5, 1],
})

addColor(
{
    name: "transparent",
    rgba: [0, 0, 0, 0],
})

function withAlpha(color, alpha)
{
    return {
        name: color.name,
        rgba: [color.rgba[0], color.rgba[1], color.rgba[2], alpha],
    }
}

// ! Simulation


function drawSimulation(simulation)
{
    clearRenderer(simulation.renderer);

    for (var regionIndex = 0; regionIndex < simulation.measurementRegions.length; regionIndex++)
    {
        var region = simulation.measurementRegions[regionIndex];
        drawRectangle(simulation.renderer, region.bounds, region.overlayColor);
    }

    for (var i = 0; i < simulation.walls.length; i++)
    {
        var wall = simulation.walls[i];
        drawTrajectory(simulation.renderer, [wall.start, wall.end], colors.black);
    }

    drawParticles(simulation.renderer, simulation.particles, simulation.parameters.radiusScaling);

    if (simulation.parameters.trajectoryEnabled)
    {
        drawTrajectory(simulation.renderer, simulation.trajectory, colors.blue);
    }

    var billiardCue = simulation.mouse.billiardCue;
    if (billiardCue.visible)
    {
        var billiardCueTrajectory = [billiardCue.start, billiardCue.end];
        drawTrajectory(simulation.renderer, billiardCueTrajectory, colors.black);
    }
}

var updateSimulation = function()
{

    var relativePosition = v2.create(0, 0);
    var relativeVelocity = v2.create(0, 0);
    var deltaVelocity = v2.create(0, 0);
    var deltaAcceleration = v2.create(0, 0);

    var totalMomentum = v2.create(0, 0);
    var wallNormal = v2.create(0, 0);
    var projection = v2.create(0, 0);

    return function(updateFunction, simulation, timestamp)
    {
        // ! Keep track of time

        if (simulation.isFirstFrameAfterPause) {
            simulation.isFirstFrameAfterPause = false;
            simulation.previousTimestamp = timestamp;
        }

        var elapsedTime = timestamp - simulation.previousTimestamp;
        simulation.previousTimestamp = timestamp;
        simulation.timeLeftToSimulate += elapsedTime;

        while (simulation.timeLeftToSimulate > simulation.parameters.frameDuration)
        {
            simulation.timeLeftToSimulate -= simulation.parameters.frameDuration;

            var slowingFactor = 0.01;
            var dt = simulation.parameters.frameDuration * simulation.parameters.simulationSpeed * slowingFactor;

            // TODO: these should go in the measurement region code
            v2.set(totalMomentum, 0, 0);
            var colorCounts = {};

            var gravityAcceleration = v2.create(0, -simulation.parameters.gravityAcceleration);

            // ! Process input

            if (simulation.mouse.leftButton.transitionCount > 0)
            {
                var billiardCue = simulation.mouse.billiardCue;
                if ((simulation.mouse.mode === "billiardCue") && billiardCue.visible)
                {
                    // Let go of billiardCue
                    var activeParticle = simulation.particles[simulation.mouse.activeParticleIndex]
                    v2.subtract(relativePosition, activeParticle.position, simulation.mouse.worldPosition);
                    v2.scaleAndAdd(activeParticle.velocity, activeParticle.velocity,
                        relativePosition, billiardCue.strength);
                    billiardCue.visible = false;
                }

                simulation.mouse.mode = "";
            }

            if (simulation.mouse.leftButton.down)
            {
                var extraRadius = 1;
                var pickedParticle = pickParticle(simulation, simulation.mouse.worldPosition, extraRadius);
                var isCloseToParticle = (pickedParticle >= 0);

                var hitParticle = pickParticle(simulation, simulation.mouse.worldPosition);
                var isOnParticle = (hitParticle >= 0);

                if (simulation.mouse.mode === "")
                {
                    var latestDownKey = arrayLast(simulation.downKeys);
                    if (latestDownKey == "c")
                    {
                        simulation.mouse.mode = "createParticles";
                    }
                    else if (latestDownKey == "d")
                    {
                        simulation.mouse.mode = "destroyParticles";
                    }
                    else if (latestDownKey == "b")
                    {
                        if (isOnParticle)
                        {
                            simulation.mouse.mode = "billiardCue";
                            simulation.mouse.activeParticleIndex = hitParticle;
                        }
                    }
                    else
                    {
                        if (isOnParticle)
                        {
                            simulation.mouse.mode = "dragParticle";
                            simulation.mouse.activeParticleIndex = hitParticle;
                        }
                    }
                }

                if ((simulation.mouse.mode == "createParticles") && (!isCloseToParticle))
                {
                    addParticle(simulation, simulation.mouse.worldPosition);
                }
                else if (simulation.mouse.mode == "destroyParticles")
                {
                    if (hitParticle >= 0)
                    {
                        removeParticle(simulation, hitParticle);
                    }
                }
                else if (simulation.mouse.mode == "billiardCue")
                {
                    var billiardCue = simulation.mouse.billiardCue;
                    var activeParticle = simulation.particles[simulation.mouse.activeParticleIndex]
                    v2.subtract(relativePosition, simulation.mouse.worldPosition, activeParticle.position);
                    var effectiveRadius = activeParticle.radius * simulation.parameters.radiusScaling;
                    billiardCue.visible = v2.square(relativePosition) > squared(effectiveRadius);
                    v2.normalize(relativePosition, relativePosition);
                    v2.copy(billiardCue.start, simulation.mouse.worldPosition);
                    v2.scaleAndAdd(billiardCue.end, billiardCue.start, relativePosition, billiardCue.length);
                }
            }

            // Update lots of stuff
            // TODO: put this stuff inline here

            updateParticleCount(simulation);

            if (!simulation.pausedByUser)
            {
                // ! Equations of motion

                var particles = simulation.particles;
                var particleCount = simulation.particles.length;

                for (var particleIndex = 0; particleIndex < particleCount;
                    ++particleIndex)
                {
                    var particle = particles[particleIndex];

                    // Scale velocities with delta temperature

                    v2.scale(particle.velocity, particle.velocity, simulation.parameters.deltaTemperature);

                    // velocity verlet

                    v2.scaleAndAdd(particle.velocity, particle.velocity, particle.acceleration, 0.5 * dt);
                    v2.scale(particle.deltaPosition, particle.velocity, dt);

                    // reset stuff before next loop
                    v2.copy(particle.acceleration, gravityAcceleration);
                    particle.potentialEnergy = -v2.dot(particle.position, gravityAcceleration);
                }

                // ! Time of impact

                // TODO: make this be a global function instead of a closure if it improves performance
                function recordCollision(collisions, particle, otherParticle) {
                    var relativeMovement = v2.subtract(v2.alloc(), particle.deltaPosition, otherParticle.deltaPosition);
                    var intersection = intersectionCircleLine(
                        otherParticle.position, (particle.radius + otherParticle.radius) * simulation.parameters.radiusScaling,
                        particle.position, relativeMovement
                    );
                    v2.free(relativeMovement);
                    var iscollision = intersection.isIntersected && (0 < intersection.t1) && (intersection.t1 < 1);
                    if (iscollision)
                    {
                        var collision = {
                            time: intersection.t1,
                            first: particle,
                            second: otherParticle,
                        }
                        collisions.push(collision);
                    }
                }

                var collisions = [];

                for (var i = 0; i < particleCount; ++i)
                {
                    for (var j = 0; j < i; ++j)
                    {
                        recordCollision(collisions, particles[i], particles[j]);
                    }
                }

                while (collisions.length != 0)
                {

                    // take first collision
                    // TODO: handle all simultaneous collisions?
                    var firstIndex = arrayMinIndex(collisions, function(c) { return c.time; });
                    var collision = collisions[firstIndex];

                    // advance time for everyone
                    var remainingTime = 1 - collision.time;
                    for (var particleIndex = 0; particleIndex < particles.length; particleIndex++) {
                        var particle = particles[particleIndex];
                        v2.scaleAndAdd(particle.position, particle.position, particle.deltaPosition, collision.time);
                        v2.scale(particle.deltaPosition, particle.deltaPosition, remainingTime);
                    }

                    // deal with this particular collision
                    // TODO: energy corrections (to conserve energy)

                    // Elastic collision

                    var normal = v2.alloc();
                    v2.subtract(normal, collision.first.position, collision.second.position);
                    v2.normalize(normal, normal);
                    var massSum = collision.first.mass + collision.second.mass;

                    v2.subtract(relativeVelocity, collision.first.velocity, collision.second.velocity);
                    v2.projectOntoNormal(deltaVelocity, relativeVelocity, normal);

                    v2.free(normal);

                    v2.scaleAndAdd(collision.first.velocity, collision.first.velocity,
                        deltaVelocity, -2 * collision.second.mass / massSum);
                    v2.scaleAndAdd(collision.second.velocity, collision.second.velocity,
                        deltaVelocity, 2 * collision.first.mass / massSum);

                    // remove collisions for involved particles
                    // and rescale the rest of the collisions
                    for (var i = 0; i < collisions.length; i++) {
                        var c = collisions[i];
                        if ((c.first === collision.first) 
                            || (c.first === collision.second)
                            || (c.second === collision.first)
                            || (c.second === collision.second))
                        {
                            collisions.splice(i--, 1);
                            continue;
                        }

                        // TODO: this should maybe be avoided? use absolute time instead?
                        collisions[i].time = (collisions[i].time - collision.time) / remainingTime;
                    }

                    // calculate any new collisions for involved particles

                    for (var i = 0; i < particles.length; i++) {
                        // TODO: make collision.first and second be indices
                        if ((particles[i] !== collision.first) 
                            && (particles[i] !== collision.second))
                        {
                            recordCollision(collisions, collision.first, particles[i]);
                            recordCollision(collisions, collision.second, particles[i]); 
                        }
                    }






                    // DOTHISNEXT!!!!!!!!!
                    // TODO: bug when a particle collides with two other particles simultaneously








                }

                // move last bit

                for (var particleIndex = 0; particleIndex < particles.length; particleIndex++) {
                    var particle = particles[particleIndex];
                    v2.add(particle.position, particle.position, particle.deltaPosition);
                }


                // ! Calculate forces

                // for (var i = 0; i < particleCount; ++i)
                // {
                //     var particle = particles[i];

                //     // ! Particle interactions

                //     for (var j = 0; j < i; ++j)
                //     {
                //         var otherParticle = particles[j];
                //         // TODO: use quadtree with given cutoff distance

                //         var separationFactor = simulation.parameters.separationFactor;

                //         var distanceLimit = simulation.parameters.radiusScaling * (particle.radius + otherParticle.radius);
                //         var separation = separationFactor * distanceLimit;

                //         v2.subtract(relativePosition, otherParticle.position, particle.position);
                //         var distanceBetweenCenters = v2.length(relativePosition);

                //         var invDistance = 1 / distanceBetweenCenters;
                //         var potentialEnergy = lennardJonesEnergy(invDistance, simulation.parameters.bondEnergy, separation);

                //         var normal = v2.scale(relativePosition, relativePosition, 1 / distanceBetweenCenters);
                //         var isHardCollision = distanceBetweenCenters < distanceLimit;

                //         if (isHardCollision)
                //         {


                //             var overlap = distanceLimit - distanceBetweenCenters;
                //             var massSum = particle.mass + otherParticle.mass;

                //             // Move out of overlap

                //             // TODO: calculate time to collision instead of moving out of overlap
                //             // TODO: the moving makes the outcome depend on the indices of the particles 
                //             // (as they are processed in order)

                //             v2.scaleAndAdd(particle.position, particle.position,
                //                 normal, -overlap * otherParticle.mass / massSum);
                //             v2.scaleAndAdd(otherParticle.position, otherParticle.position,
                //                 normal, overlap * particle.mass / massSum);

                //             // Elastic collision

                //             v2.subtract(relativeVelocity, particle.velocity, otherParticle.velocity);
                //             v2.projectOntoNormal(deltaVelocity, relativeVelocity, normal);

                //             // NOTE: I change the velocity instead of the acceleration, because otherwise
                //             // there are transient dips in energy at collision (because of how velocity verlet works)

                //             v2.scaleAndAdd(particle.velocity, particle.velocity,
                //                 deltaVelocity, -2 * otherParticle.mass / massSum);
                //             v2.scaleAndAdd(otherParticle.velocity, otherParticle.velocity,
                //                 deltaVelocity, 2 * particle.mass / massSum);

                //             // NOTE: change potential energy to compensate for moving particles

                //             var newPotentialEnergy = lennardJonesEnergy(1 / distanceLimit, simulation.parameters.bondEnergy, separation);
                //             var potentialEnergyDifference = potentialEnergy - newPotentialEnergy;

                //             // NOTE: using half of potential energy for each particle
                //             // TODO: special case for zero/small velocity?
                //             var squaredVelocity = v2.square(particle.velocity);
                //             if (squaredVelocity !== 0)
                //             {
                //                 var velocityFactor = Math.sqrt(1 + potentialEnergyDifference / (particle.mass * v2.square(particle.velocity)));
                //                 v2.scale(particle.velocity, particle.velocity, velocityFactor);
                //             }

                //             var squaredVelocity = v2.square(otherParticle.velocity);
                //             if (squaredVelocity !== 0)
                //             {
                //                 var velocityFactor = Math.sqrt(1 + potentialEnergyDifference / (otherParticle.mass * v2.square(otherParticle.velocity)));
                //                 v2.scale(otherParticle.velocity, otherParticle.velocity, velocityFactor);
                //             }
                //         }
                //         else if (simulation.parameters.bondEnergy !== 0)
                //         {
                //             // Potential force
                //             var force = lennardJonesForce(invDistance, simulation.parameters.bondEnergy, separation);
                //             var potentialEnergy = lennardJonesEnergy(invDistance, simulation.parameters.bondEnergy, separation);
                //             // TODO: this is a little weird
                //             particle.potentialEnergy += potentialEnergy / 2;
                //             otherParticle.potentialEnergy += potentialEnergy / 2;

                //             var accelerationDirection = normal;
                //             v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                //                 accelerationDirection, -force / particle.mass);
                //             v2.scaleAndAdd(otherParticle.acceleration, otherParticle.acceleration,
                //                 accelerationDirection, force / otherParticle.mass);
                //         }
                //     }

                //     // Friction

                //     v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                //         particle.velocity, -simulation.parameters.friction / particle.mass);
                // }


                // ! User interaction

                if (simulation.mouse.activeParticleIndex >= 0)
                {
                    var particle = particles[simulation.mouse.activeParticleIndex];
                    if (simulation.mouse.mode === "dragParticle")
                    {
                        v2.subtract(relativePosition, simulation.mouse.worldPosition, particle.position);
                        v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                            relativePosition, 0.1 / particle.mass);
                    }
                }

                for (var particleIndex = 0; particleIndex < particleCount;
                    ++particleIndex)
                {
                    var particle = particles[particleIndex];

                    // finish velocity verlet
                    v2.scaleAndAdd(particle.velocity, particle.velocity, particle.acceleration, 0.5 * dt);

                    // calculate quantities
                    if (doesRectContainPoint(simulation.leftRect, particle.position))
                    {
                        colorCounts[particle.color.name] = 1 + (colorCounts[particle.color.name] || 0);
                    }

                    particle.kineticEnergy = 0.5 * particle.mass * v2.square(particle.velocity);

                    v2.scaleAndAdd(totalMomentum, totalMomentum, particle.velocity, particle.mass);


                    // ! Collision with walls

                    for (var i = 0; i < simulation.walls.length; i++)
                    {
                        var collision = wallParticleCollision(simulation, simulation.walls[i], particle);

                        if (collision.overlap > 0)
                        {
                            v2.scaleAndAdd(particle.position, particle.position, collision.normal, collision.overlap);

                            v2.projectOntoNormal(projection, particle.velocity, collision.normal);
                            v2.scaleAndAdd(particle.velocity, particle.velocity, projection, -2);
                        }



                    }

                }

                // ! Collision with other particles
                if (simulation.parameters.collisionEnabled)
                {
                    if (quadtreeEnabled)
                    {
                        quadtree.clear();
                        for (var particleIndex = 0; particleIndex < particles.length;
                            ++particleIndex)
                        {
                            var particle = particles[particleIndex];
                            quadtree.add(particle);
                        }
                        quadtree.collideAll(collide);
                    }
                    else
                    {
                        for (var i = 0; i < particleCount; ++i)
                        {
                            for (var j = 0; j < i; ++j)
                            {
                                collide(particles[i], particles[j]);
                            }
                        }
                    }
                }

                // ! Trajectory

                if (simulation.parameters.trajectoryEnabled && (simulation.particles.length > 0))
                {
                    simulation.trajectory.push(v2.clone(simulation.particles[0].position));
                }

                // ! Measurements

                var totalEntropy = 0;
                var probabilities = [];
                var counts = [];
                var totalArea = rectangleArea(simulation.boxBounds);

                var barWidth = 1 / simulation.measurementRegions.length;
                for (var regionIndex = 0; regionIndex < simulation.measurementRegions.length; regionIndex++)
                {
                    var region = simulation.measurementRegions[regionIndex];
                    var m = region.measurements;

                    // Add new value, remove old, crufty ones
                    m.time.push(simulation.time);
                    var tooOldCount = -1;
                    // NOTE: save more data than shown, to avoid weird autoscaling in plots
                    while ((simulation.time - m.time[++tooOldCount]) > 2 * simulation.parameters.measurementWindowLength)
                    {};

                    for (var key in m)
                    {
                        m[key].splice(0, tooOldCount);
                    }

                    var regionEnergy = 0;
                    var regionTemperature = 0;
                    var regionCount = 0;

                    for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++)
                    {
                        var particle = simulation.particles[particleIndex];

                        if (doesRectContainPoint(region.bounds, particle.position))
                        {
                            regionEnergy += (particle.potentialEnergy + particle.kineticEnergy);
                            regionTemperature += particle.kineticEnergy;
                            regionCount += 1;
                        }
                    }

                    regionTemperature /= simulation.particles.length;

                    m.energy.push(regionEnergy);
                    m.temperature.push(regionTemperature);
                    m.count.push(regionCount);

                    addCurve(simulation.visualizations.energy,
                    {
                        x: m.time,
                        y: m.energy,
                        color: region.color
                    });
                    addCurve(simulation.visualizations.temperature,
                    {
                        x: m.time,
                        y: m.temperature,
                        color: region.color
                    });
                    addCurve(simulation.visualizations.counts,
                    {
                        x: m.time,
                        y: m.count,
                        color: region.color,
                    });
                    addBars(simulation.visualizations.countsHistogram,
                    {
                        bars: [
                        {
                            start: barWidth * regionIndex,
                            end: barWidth * (regionIndex + 1),
                            value: regionCount,
                            color: region.color,
                        }]
                    });

                    totalEntropy += microstateEntropy(regionCount / simulation.particles.length);
                    var area = rectangleArea(region.bounds);
                    probabilities.push(area / totalArea);
                    counts.push(regionCount);
                }

                // TODO: make a list with global visualizations too

                simulation.times.push(simulation.time);
                simulation.entropy.push(totalEntropy);
                simulation.probability.push(multinomial(probabilities, counts));

                var tooOldCount = -1;
                // NOTE: save more data than shown, to avoid weird autoscaling in plots
                while ((simulation.time - simulation.times[++tooOldCount]) > 2 * simulation.parameters.measurementWindowLength)
                {};

                simulation.entropy.splice(0, tooOldCount);
                simulation.times.splice(0, tooOldCount);
                simulation.probability.splice(0, tooOldCount);

                addCurve(simulation.visualizations.entropy,
                {
                    x: m.time,
                    y: simulation.entropy,
                });

                addCurve(simulation.visualizations.probability,
                {
                    x: m.time,
                    y: simulation.probability,
                });

                // ! Plot things

                setGraphLimits(simulation.visualizations.counts,
                {
                    yMax: simulation.particles.length
                });
                setGraphLimits(simulation.visualizations.entropy,
                {
                    yMax: 1
                });
                setGraphLimits(simulation.visualizations.probability,
                {
                    yMax: 1
                });


                for (var i = 0; i < simulation.timeSeries.length; ++i)
                {
                    var graph = simulation.timeSeries[i];
                    // TODO: make the limits change smoothly, so it's less noticable
                    setGraphLimits(graph,
                    {
                        xMin: simulation.time - simulation.parameters.measurementWindowLength,
                        xMax: simulation.time,
                        yMin: 0,
                    })
                    drawGraph(graph);
                }

                setGraphLimits(simulation.visualizations.countsHistogram,
                {
                    xMin: 0,
                    xMax: 1,
                    yMin: 0,
                    yMax: simulation.particles.length
                });
                drawGraph(simulation.visualizations.countsHistogram);

            }

            simulation.customUpdate(simulation);

            // ! Drawing

            drawSimulation(simulation);

            // ! Input cleanup

            simulation.mouse.leftButton.transitionCount = 0;
            simulation.mouse.rightButton.transitionCount = 0;


        }

        if (simulation.running)
        {
            simulation.requestFrameId = window.requestAnimationFrame(updateFunction);
        }
    }
}();

// ! Math stuff

function microstateEntropy(p)
{
    if (p == 0)
    {
        return 0;
    }
    else
    {
        return -p * Math.log2(p);
    }
}

function squared(x)
{
    return x * x
};

function sum(array)
{
    return array.reduce(function(x, y)
    {
        return x + y;
    });
}

function binomial(n, k)
{
    var product = 1;
    for (var i = 0; i < k; i++)
    {
        product *= (n - 1 - i) / i;
    }
    return product;
}

var factorial = function()
{
    var cache = [1];

    return function(n)
    {
        if (n < 0)
        {
            return;
        }
        n = Math.floor(n);
        if (n >= cache.length)
        {
            for (var i = cache.length; i <= n; i++)
            {
                cache.push(cache[i - 1] * i);
            }
        }
        return cache[n];
    }
}();


function multinomial(probabilities, counts)
{
    var product = factorial(sum(counts));
    for (var i = 0; i < counts.length; i++)
    {
        product *= Math.pow(probabilities[i], counts[i]);
        product /= factorial(counts[i]);
    }
    return product;
}


// ! Rectangle



function Rectangle()
{
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.width = 0;
    this.height = 0;
    this.center = v2.create(0, 0);
    return this;
}

function setLeftTopRightBottom(rectangle, left, top, right, bottom)
{
    rectangle.left = left;
    rectangle.right = right;
    rectangle.top = top;
    rectangle.bottom = bottom;
    rectangle.width = right - left;
    rectangle.height = top - bottom;
    v2.set(rectangle.center, (left + right) / 2, (top + bottom) / 2);
    return rectangle;
}

function setLeftTopWidthHeight(rectangle, left, top, width, height)
{
    rectangle.left = left;
    rectangle.top = top;
    rectangle.right = left + width;
    rectangle.bottom = top - height;
    rectangle.width = width;
    rectangle.height = height;
    v2.set(rectangle.center, left + width / 2, top + height / 2);
    return rectangle;
}

function setCenterWidthHeight(rectangle, center, width, height)
{
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    rectangle.left = center[0] - halfWidth;
    rectangle.top = center[1] + halfHeight;
    rectangle.right = center[0] + halfWidth;
    rectangle.bottom = center[1] - halfHeight;
    rectangle.width = width;
    rectangle.height = height;
    v2.copy(rectangle.center, center);
    return rectangle;
}

function copyRectangle(newRect, rect)
{
    newRect.left = rect.left;
    newRect.right = rect.right;
    newRect.top = rect.top;
    newRect.bottom = rect.bottom;
    newRect.width = rect.width;
    newRect.height = rect.height;
    newRect.center = v2.clone(rect.center);
    return newRect;
}

function doesRectContainRect(outer, inner)
{
    var insideX = (outer.left <= inner.left) && (inner.right <= outer.right);
    var insideY = (outer.bottom <= inner.bottom) && (inner.top <= outer.top);
    return insideX && insideY;
}

function doesRectContainPoint(rectangle, point)
{
    var insideX = (rectangle.left <= point[0]) && (point[0] <= rectangle.right)
    var insideY = (rectangle.bottom <= point[1]) && (point[1] <= rectangle.top)
    return insideX && insideY;
}

function randomPointInRect(rect)
{
    return v2.create(randomInInterval(rect.left, rect.right),
        randomInInterval(rect.top, rect.bottom));
}

function randomInInterval(a, b)
{
    return (a + (b - a) * Math.random());
}

function rectangleArea(rectangle)
{
    return (rectangle.width * rectangle.height);
}

// ! Intersection

function intersectionCircleLine(
    circleCenter, circleRadius,
    lineStart, lineVector
)
{
    var c = v2.subtract(v2.alloc(), circleCenter, lineStart);
    var dotBC = v2.dot(lineVector, c);
    var bSq = v2.square(lineVector);
    var rootInput = square(dotBC) + bSq * (squared(circleRadius) - v2.square(c));
    v2.free(c);
    if (rootInput > 0)
    {
        var root = Math.sqrt(rootInput);
        var bSqInv = 1 / bSq;
        var t1 = (dotBC - root) * bSqInv;
        var t2 = (dotBC + root) * bSqInv;


        return {
            isIntersected: true,
            t1: t1,
            t2: t2,
        }
    }
    else
    {
        return {
            isIntersected: false
        };
    }
}


// ! Collision

function wallParticleCollision(simulation, wall, particle)
{
    var wallVector = v2.subtract(v2.create(0, 0), wall.end, wall.start);
    var radius = particle.radius * simulation.parameters.radiusScaling;
    var fromStart = v2.subtract(v2.create(0, 0), particle.position, wall.start);
    var fromEnd = v2.subtract(v2.create(0, 0), particle.position, wall.end);
    var normal = v2.rotateCCW(v2.create(0, 0), wallVector);
    v2.normalize(normal, normal);
    var rejection = v2.projectOntoNormal(v2.create(0, 0), fromStart, normal);
    var rejectionLengthSquared = v2.square(rejection);
    var isAfterStart = isSameDirection(fromStart, wallVector);
    var isBeforeEnd = !isSameDirection(fromEnd, wallVector);

    var overlap = 0;

    var isIntersectingWall = (rejectionLengthSquared < squared(radius)) && isAfterStart && isBeforeEnd;
    if (isIntersectingWall)
    {
        overlap = radius - Math.sqrt(rejectionLengthSquared);
        v2.normalize(normal, rejection);
    }
    else
    {
        var distanceFromStart = v2.length(fromStart);
        if (distanceFromStart < radius)
        {
            overlap = radius - distanceFromStart;
            v2.normalize(normal, fromStart);
        }

        var distanceFromEnd = v2.length(fromEnd);
        if (distanceFromEnd < radius)
        {
            overlap = radius - distanceFromEnd;
            v2.normalize(normal, fromEnd);
        }
    }

    return {
        overlap: overlap,
        normal: normal,
    };
}

function isIntersecting(shape, otherShape)
{
    var direction = v2.create(1, 0);
    var s = support(direction, shape);
    var s2 = support(v2.scale(v2.create(0, 0), direction, -1), otherShape);
    var minkowskiPoint = v2.subtract(v2.create(0, 0), s, s2);
    var simplex = [minkowskiPoint];
    var direction = v2.scale(direction, minkowskiPoint, -1);
    while (true)
    {
        // TODO: do this more efficiently if we know the pair of shapes
        var s = support(direction, shape);
        var s2 = support(v2.scale(v2.create(0, 0), direction, -1), otherShape);
        var a = v2.subtract(v2.create(0, 0), s, s2);
        if (v2.dot(a, direction) < 0)
        {
            return false;
        }
        simplex.push(a);
        // do simplex

        if (simplex.length <= 1)
        {
            // assert
        }

        if (simplex.length == 2)
        {
            var a = simplex[1];
            var b = simplex[0];
            var ab = v2.subtract(v2.create(0, 0), b, a);
            var ao = v2.scale(v2.create(0, 0), a, -1);
            if (isSameDirection(ab, ao))
            {
                simplex = [a, b];
                v2.rotateCCW(direction, ab);
                v2.scale(direction, direction, v2.outer(ab, ao));
            }
            else
            {
                simplex = [a];
                v2.copy(direction, ao);
            }
        }

        if (simplex.length == 3)
        {
            var a = simplex[2];
            var b = simplex[1];
            var c = simplex[0];
            var ab = v2.subtract(v2.create(0, 0), b, a);
            var ac = v2.subtract(v2.create(0, 0), c, a);

            var orientation = v2.outer(ab, ac);
            var abNormal = v2.rotateCW(v2.create(0, 0), ab);
            v2.scale(abNormal, abNormal, orientation);
            var acNormal = v2.rotateCCW(v2.create(0, 0), ac);
            v2.scale(acNormal, acNormal, orientation);
            var ao = v2.scale(v2.create(0, 0), a, -1);

            var inStarRegion = false;
            if (isSameDirection(acNormal, ao))
            {
                if (isSameDirection(ac, ao))
                {
                    simplex = [a, c];
                    v2.copy(direction, acNormal);
                }
                else
                {
                    inStarRegion = true;
                }
            }
            else if (isSameDirection(abNormal, ao))
            {
                inStarRegion = true;
            }
            else
            {
                // origin is inside simplex
                return true;
            }


            if (inStarRegion)
            {
                if (isSameDirection(ab, ao))
                {
                    simplex = [a, b];
                    v2.copy(direction, abNormal);
                }
                else
                {
                    simplex = [a];
                    v2.copy(direction, ao);
                }
            }
        }
    }
}

function isSameDirection(a, b)
{
    return v2.dot(a, b) > 0;
}

function support(direction, shape)
{
    if (shape.type == "circle")
    {
        // NOTE: Assumes direction is a unit vector
        return v2.scale(v2.create(0, 0), direction, shape.radius);
    }

    if (shape.type == "polygon")
    {
        var maximumDistance = -Number.MAX_VALUE;
        var maximumVertex;
        for (var vertexIndex = 0; vertexIndex < shape.vertices.length; vertexIndex++)
        {
            var vertex = shape.vertices[vertexIndex];
            var distance = v2.dot(vertex, direction);
            if (distance > maximumDistance)
            {
                maximumDistance = distance;
                maximumVertex = vertex;
            }
        }
        return v2.clone(maximumVertex);
    }
}

function testGJK()
{
    var h = {
        type: "polygon",
        vertices: [v2.create(-1, 0), v2.create(1, 0)]
    };
    var v = {
        type: "polygon",
        vertices: [v2.create(0, -1), v2.create(0, 1)]
    };
    var t = {
        type: "polygon",
        vertices: [v2.create(-2, 0), v2.create(2, 1)]
    };
    var c = {
        type: "circle",
        center: v2.create(0, 0),
        radius: 0.01
    };

    var testBothWays = function(shape, otherShape, expected)
    {
        var a = isIntersecting(shape, otherShape);
        var b = isIntersecting(otherShape, shape);
        return (a == b) && (a == expected);
    }

    var tests = [testBothWays(h, v, true), testBothWays(h, t, false), testBothWays(v, t, true), testBothWays(c, t, false), testBothWays(c, h, true), testBothWays(c, v, true)];
    for (var i = 0; i < tests.length; i++)
    {
        if (!tests[i])
        {
            console.log("Test " + i + " failed.");
        }
    }
}

// ! Quadtree

Quadtree = function(bounds, maxObjects, maxDepth)
{
    this.objects = [];
    this.bounds = bounds;
    this.subtrees = undefined;
    this.maxObjects = maxObjects || 4;
    this.maxDepth = maxDepth || 7;
}

Quadtree.prototype.add = function(object)
{
    if (this.subtrees)
    {
        for (var subtreeIndex = 0; subtreeIndex < this.subtrees.length;
            ++subtreeIndex)
        {
            var subtree = this.subtrees[subtreeIndex];
            if (doesRectContainRect(subtree.bounds, object.bounds))
            {
                subtree.add(object);
                return;
            }
        }
        this.objects.push(object);
        return;
    }
    else
    {
        this.objects.push(object);

        if (this.objects.length > this.maxObjects)
        {
            // create subtrees
            var topLeft = setLeftTopRightBottom(new Rectangle(),
                this.bounds.left, this.bounds.top,
                this.bounds.center[0], this.bounds.center[1]);
            var topRight = setLeftTopRightBottom(new Rectangle(),
                this.bounds.center[0], this.bounds.top,
                this.bounds.right, this.bounds.center[1]);
            var bottomLeft = setLeftTopRightBottom(new Rectangle(),
                this.bounds.left, this.bounds.center[1],
                this.bounds.center[0], this.bounds.bottom);
            var bottomRight = setLeftTopRightBottom(new Rectangle(),
                this.bounds.center[0], this.bounds.center[1],
                this.bounds.right, this.bounds.bottom);
            this.subtrees = [new Quadtree(topLeft), new Quadtree(topRight),
                new Quadtree(bottomLeft), new Quadtree(bottomRight)
            ];
            for (var objectIndex = 0; objectIndex < this.objects.length;
                ++objectIndex)
            {
                var object = this.objects[objectIndex];
                for (var subtreeIndex = 0; subtreeIndex < this.subtrees.length;
                    ++subtreeIndex)
                {
                    var subtree = this.subtrees[subtreeIndex];
                    if (doesRectContainRect(subtree.bounds, object.bounds))
                    {
                        subtree.add(object);
                        break;
                    }
                }
            }
        }
    }

}

Quadtree.prototype.collideAll = function(collisionFunction)
{
    for (var objectIndex = 0; objectIndex < this.objects.length;
        ++objectIndex)
    {
        this.collideWith(this.objects[objectIndex], collisionFunction);
    }
    if (this.subtrees)
    {
        for (var subtreeIndex = 0; subtreeIndex < this.subtrees.length;
            ++subtreeIndex)
        {
            var subtree = this.subtrees[subtreeIndex];
            subtree.collideAll(collisionFunction);
        }
    }
}

Quadtree.prototype.collideWith = function(collider, collisionFunction)
{
    for (var objectIndex = 0; objectIndex < this.objects.length;
        ++objectIndex)
    {
        var object = this.objects[objectIndex];
        if (object != collider)
        {
            collisionFunction(collider, object);
        }
    }
    if (this.subtrees)
    {
        for (var subtreeIndex = 0; subtreeIndex < this.subtrees.length;
            ++subtreeIndex)
        {
            var subtree = this.subtrees[subtreeIndex];
            subtree.collideWith(collider, collisionFunction);
        }
    }
}

Quadtree.prototype.clear = function()
{
    this.objects = [];
    if (this.subtrees)
    {
        for (var subtreeIndex = 0; subtreeIndex < this.subtrees.length;
            ++subtreeIndex)
        {
            var subtree = this.subtrees[subtreeIndex];
            subtree.clear();
        }
    }
}