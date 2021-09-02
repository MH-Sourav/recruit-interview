import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/Snake.module.css";

const Config = {
  height: 25,
  width: 25,
  cellSize: 32,
};

const CellType = {
  Snake: "snake",
  Food: "food",
  Empty: "empty",
};

const Direction = {
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
  Top: { x: 0, y: -1 },
  Bottom: { x: 0, y: 1 },
};

const Cell = ({ x, y, type }) => {
  const getStyles = () => {
    switch (type) {
      case CellType.Snake:
        return {
          backgroundColor: "yellowgreen",
          borderRadius: 8,
          padding: 2,
        };

      case CellType.Food:
        return {
          backgroundColor: "darkorange",
          borderRadius: 20,
          width: 32,
          height: 32,
        };

      default:
        return {};
    }
  };
  return (
    <div
      className={styles.cellContainer}
      style={{
        left: x * Config.cellSize,
        top: y * Config.cellSize,
        width: Config.cellSize,
        height: Config.cellSize,
      }}
    >
      <div className={styles.cell} style={getStyles()}></div>
    </div>
  );
};

const getRandomCell = () => ({
  x: Math.floor(Math.random() * Config.width),
  y: Math.floor(Math.random() * Config.height),
});

const Snake = () => {
  const getDefaultSnake = () => [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];
  const grid = useRef();

  // snake[0] is head and snake[snake.length - 1] is tail
  const [snake, setSnake] = useState(getDefaultSnake());
  const [direction, setDirection] = useState(Direction.Right);

  const [foods, setFoods] = useState([]);
  const [score, setScore] = useState(0);

  const [isGameOver, setIsGameOver] = useState(false);

  // move the snake
  useEffect(() => {
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        const newHead = {
          x: (head.x + direction.x + Config.width) % Config.width,
          y: (head.y + direction.y + Config.height) % Config.height
        };

        if (isSnake(newHead)){
          setIsGameOver(true);
        }
        // make a new snake by extending head
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        const newSnake = [newHead, ...snake];

        // remove tail
        if (!isFood(newHead)){
          newSnake.pop();
        }

        return newSnake;
      });
    };

    runSingleStep();
    const timer = setInterval(runSingleStep, 500);

    return () => clearInterval(timer);
  }, [direction, foods]);

  // update score whenever head touches a food
  useEffect(() => {
    const head = snake[0];
    if (isFood(head)) {
      setScore((score) => {
        return score + 1;
      });
      setFoods((foods) => {
        return foods.filter((food) => food.x !== head.x || food.y !== head.y);
      });
    }
  }, [snake]);
  
  //initial food
  useEffect(() => {setFoods([getNewFood()])}, []);

  //adding a new food every 3 second
  useEffect(() => {
    const addNewFood = () => {
      setFoods((foods) => {
        return [...foods, getNewFood()];
      });  
    };

    const newFoodTimer = setInterval(addNewFood, 3000);

    return () => clearInterval(newFoodTimer);
  }, [isGameOver]);

  //removing expired food
  useEffect(() => {
    const removeFood = () => {
      setFoods((foods) => {
        if (foods.length && (new Date().getTime() - foods[0].time) >= 10000){
          return foods.slice(1)
        }
        return foods
      });
    };

    const foodRemovingTimer = setInterval(removeFood, 1000);

    return () => clearInterval(foodRemovingTimer);
  }, [isGameOver]);

  //reset game whenever the game is over
  useEffect(() => {
    const resetGame = () => {
      setSnake(getDefaultSnake());
      setDirection(Direction.Right);
      setFoods([getNewFood()]);
      setScore(0);
      setIsGameOver(false);
    };

    if (isGameOver) {
      resetGame();
    }
  }, [isGameOver]);

  useEffect(() => {
    const handleNavigation = (event) => {
      switch (event.key) {
        case "ArrowUp":
          setDirection((direction) => {
            return direction === Direction.Bottom? Direction.Bottom : Direction.Top;
          });
          break;

        case "ArrowDown":
          setDirection((direction) => {
            return direction === Direction.Top? Direction.Top : Direction.Bottom;
          });
          break;

        case "ArrowLeft":
          setDirection((direction) => {
            return direction === Direction.Right? Direction.Right : Direction.Left;
          });
          break;

        case "ArrowRight":
          setDirection((direction) => {
            return direction === Direction.Left? Direction.Left : Direction.Right;
          });
          break;
      }
    };
    window.addEventListener("keydown", handleNavigation);

    return () => window.removeEventListener("keydown", handleNavigation);
  }, []);

  const getNewFood = () => {
    let position = getRandomCell();
    while (isSnake(position) || isFood(position)) {
      position = getRandomCell();
    }
    return {...position, time: new Date().getTime()};
  }

  const isFood = ({x, y}) => 
    foods.find((food) => food.x === x && food.y === y);

  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  const cells = [];
  for (let x = 0; x < Config.width; x++) {
    for (let y = 0; y < Config.height; y++) {
      let type = CellType.Empty;
      if (isFood({ x, y })) {
        type = CellType.Food;
      } else if (isSnake({ x, y })) {
        type = CellType.Snake;
      }
      cells.push(<Cell key={`${x}-${y}`} x={x} y={y} type={type} />);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ width: Config.width * Config.cellSize }}
      >
        Score: {score}
      </div>
      <div
        className={styles.grid}
        style={{
          height: Config.height * Config.cellSize,
          width: Config.width * Config.cellSize,
        }}
      >
        {cells}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Snake), {
  ssr: false,
});
