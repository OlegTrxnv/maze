const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 7;
const cellsVertical = 7;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 1, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 1, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 1, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 1, height, { isStatic: true }),
];
World.add(world, walls);

// Maze generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    [arr[counter], arr[index]] = [arr[index], arr[counter]];
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
  //If a cell at [row, column] was "visited" already, then return
  if (grid[row][column]) {
    return;
  }

  // Mark this cell as "visited"
  grid[row][column] = true;

  // Assemble randomly-ordered list of neighbor cells
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);
  // For each neighbor....
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    //...See if that neigbour exists (out of grid)
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }

    //...If the neighbor is "visited", continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    //...Remove a wall
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }

    // Visit that next cell
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

console.log({ grid, verticals, horizontals });

horizontals.forEach((row, rowIndex) => {
  row.forEach((isOpen, columnIndex) => {
    if (isOpen) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      3,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((isOpen, columnIndex) => {
    if (isOpen) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      3,
      unitLengthY,
      { label: "wall", isStatic: true, render: { fillStyle: "red" } }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.75,
  unitLengthY * 0.75,
  { label: "goal", isStatic: true, render: { fillStyle: "green" } }
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 2.5;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: { fillStyle: "blue" },
});
World.add(world, ball);

// Keypress handling
document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;

  if (event.key === "ArrowUp") {
    Body.setVelocity(ball, { x, y: y - 3 });
  }
  if (event.key === "ArrowRight") {
    Body.setVelocity(ball, { x: x + 3, y });
  }
  if (event.key === "ArrowDown") {
    Body.setVelocity(ball, { x, y: y + 3 });
  }
  if (event.key === "ArrowLeft") {
    Body.setVelocity(ball, { x: x - 3, y });
  }
});

// Win condition
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});

// Restart implementation
const winButton = document.querySelector(".winner");
document.addEventListener("click", (winButton) => {
  window.location.reload();
});
