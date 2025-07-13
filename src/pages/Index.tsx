import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";

interface DronePosition {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  type: "tank" | "soldier" | "building";
  x: number;
  y: number;
  health: number;
  destroyed: boolean;
}

interface Mission {
  id: number;
  name: string;
  type: "recon" | "attack" | "defense";
  description: string;
  enemies: Enemy[];
  objective: string;
  completed: boolean;
}

const FPVDroneGame: React.FC = () => {
  const [gameState, setGameState] = useState<
    "menu" | "missions" | "gameplay" | "results"
  >("menu");
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [dronePosition, setDronePosition] = useState<DronePosition>({
    x: 50,
    y: 50,
  });
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [explosions, setExplosions] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const missions: Mission[] = [
    {
      id: 1,
      name: "ОПЕРАЦИЯ РАЗВЕДКА",
      type: "recon",
      description: "Обследуйте вражескую территорию и выявите цели",
      objective: "Пролетите над всеми контрольными точками",
      enemies: [
        { id: 1, type: "tank", x: 20, y: 30, health: 100, destroyed: false },
        { id: 2, type: "soldier", x: 60, y: 20, health: 50, destroyed: false },
        {
          id: 3,
          type: "building",
          x: 80,
          y: 70,
          health: 200,
          destroyed: false,
        },
      ],
      completed: false,
    },
    {
      id: 2,
      name: "ОПЕРАЦИЯ АТАКА",
      type: "attack",
      description: "Уничтожьте вражеские позиции",
      objective: "Уничтожьте все цели",
      enemies: [
        { id: 4, type: "tank", x: 30, y: 40, health: 100, destroyed: false },
        { id: 5, type: "tank", x: 70, y: 60, health: 100, destroyed: false },
        {
          id: 6,
          type: "building",
          x: 50,
          y: 25,
          health: 200,
          destroyed: false,
        },
      ],
      completed: false,
    },
    {
      id: 3,
      name: "ОПЕРАЦИЯ ЗАЩИТА",
      type: "defense",
      description: "Защитите союзную базу от вражеских атак",
      objective: "Не допустите уничтожения базы",
      enemies: [
        { id: 7, type: "soldier", x: 10, y: 10, health: 50, destroyed: false },
        { id: 8, type: "soldier", x: 90, y: 90, health: 50, destroyed: false },
        { id: 9, type: "tank", x: 85, y: 15, health: 100, destroyed: false },
      ],
      completed: false,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => new Set(prev.add(e.key.toLowerCase())));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== "gameplay") return;

    const gameLoop = setInterval(() => {
      setDronePosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (keys.has("w") || keys.has("ц")) newY = Math.max(0, newY - 2);
        if (keys.has("s") || keys.has("ы")) newY = Math.min(100, newY + 2);
        if (keys.has("a") || keys.has("ф")) newX = Math.max(0, newX - 2);
        if (keys.has("d") || keys.has("в")) newX = Math.min(100, newX + 2);

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [keys, gameState]);

  const handleAttack = () => {
    if (!currentMission) return;

    const nearbyEnemies = currentMission.enemies.filter((enemy) => {
      const distance = Math.sqrt(
        Math.pow(enemy.x - dronePosition.x, 2) +
          Math.pow(enemy.y - dronePosition.y, 2),
      );
      return distance < 15 && !enemy.destroyed;
    });

    if (nearbyEnemies.length > 0) {
      const target = nearbyEnemies[0];

      // Создаем взрыв
      const explosionId = Date.now();
      setExplosions((prev) => [
        ...prev,
        { id: explosionId, x: target.x, y: target.y },
      ]);

      setTimeout(() => {
        setExplosions((prev) => prev.filter((exp) => exp.id !== explosionId));
      }, 600);

      // Уничтожаем цель
      setCurrentMission((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          enemies: prev.enemies.map((enemy) =>
            enemy.id === target.id ? { ...enemy, destroyed: true } : enemy,
          ),
        };
      });

      setScore(
        (prev) =>
          prev +
          (target.type === "tank"
            ? 100
            : target.type === "building"
              ? 200
              : 50),
      );

      // Дрон взрывается при атаке
      setHealth(0);
      setTimeout(() => {
        setGameState("results");
      }, 1000);
    }
  };

  const startMission = (mission: Mission) => {
    setCurrentMission(mission);
    setGameState("gameplay");
    setDronePosition({ x: 10, y: 10 });
    setHealth(100);
    setScore(0);
    setExplosions([]);
  };

  const resetGame = () => {
    setGameState("menu");
    setCurrentMission(null);
    setScore(0);
    setHealth(100);
    setExplosions([]);
  };

  const renderGameplay = () => (
    <div className="h-screen combat-bg text-white relative overflow-hidden">
      {/* HUD */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        <div className="bg-black/80 p-3 rounded combat-border">
          <div className="military-text text-sm space-y-1">
            <div>ЗДОРОВЬЕ: {health}%</div>
            <div>СЧЕТ: {score}</div>
            <div>МИССИЯ: {currentMission?.name}</div>
          </div>
        </div>
        <div className="bg-black/80 p-2 rounded">
          <div className="text-xs text-combat-red">
            УПРАВЛЕНИЕ: WASD - движение, SPACE - атака
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div
        className="absolute z-10 crosshair pointer-events-none"
        style={{
          left: `${dronePosition.x}%`,
          top: `${dronePosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-8 h-8 border-2 border-combat-red rounded-full animate-pulse-red"></div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="w-full h-full relative"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(229, 62, 62, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(229, 62, 62, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 50%, #1A1A1A 100%)
          `,
        }}
        onClick={() => keys.has(" ") && handleAttack()}
        onKeyDown={(e) => e.key === " " && handleAttack()}
        tabIndex={0}
      >
        {/* Enemies */}
        {currentMission?.enemies.map(
          (enemy) =>
            !enemy.destroyed && (
              <div
                key={enemy.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              >
                <div className="relative">
                  {enemy.type === "tank" && (
                    <div className="w-8 h-6 bg-red-600 rounded-sm border border-red-400 flex items-center justify-center">
                      <Icon name="Truck" size={16} className="text-white" />
                    </div>
                  )}
                  {enemy.type === "soldier" && (
                    <div className="w-4 h-6 bg-orange-600 rounded-full border border-orange-400 flex items-center justify-center">
                      <Icon name="User" size={12} className="text-white" />
                    </div>
                  )}
                  {enemy.type === "building" && (
                    <div className="w-10 h-8 bg-gray-600 border border-gray-400 flex items-center justify-center">
                      <Icon name="Building" size={16} className="text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-700 rounded">
                    <div
                      className="h-full bg-combat-red rounded transition-all duration-300"
                      style={{ width: `${enemy.health}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ),
        )}

        {/* Explosions */}
        {explosions.map((explosion) => (
          <div
            key={explosion.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${explosion.x}%`, top: `${explosion.y}%` }}
          >
            <div className="w-16 h-16 bg-orange-500 rounded-full animate-explosion opacity-80"></div>
            <div className="absolute inset-0 w-16 h-16 bg-red-500 rounded-full animate-explosion animation-delay-100 opacity-60"></div>
            <div className="absolute inset-0 w-16 h-16 bg-yellow-400 rounded-full animate-explosion animation-delay-200 opacity-40"></div>
          </div>
        ))}

        {/* Drone (FPV view indicator) */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{ left: `${dronePosition.x}%`, top: `${dronePosition.y}%` }}
        >
          <div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-300 flex items-center justify-center">
            <Icon name="Navigation" size={12} className="text-white" />
          </div>
        </div>
      </div>

      {/* Mission Status */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-black/80 p-3 rounded combat-border">
          <div className="military-text text-sm">
            <div>ЦЕЛЬ: {currentMission?.objective}</div>
            <div className="text-combat-red">
              ВРАГОВ:{" "}
              {currentMission?.enemies.filter((e) => !e.destroyed).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {gameState === "menu" && (
        <div className="h-screen combat-bg flex items-center justify-center">
          <Card className="w-96 bg-black/90 border-combat-red text-white">
            <CardHeader className="text-center">
              <CardTitle className="military-text text-3xl text-combat-red">
                FPV DRON COMBAT
              </CardTitle>
              <p className="text-gray-300">БОЕВОЙ СИМУЛЯТОР ДРОНА</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setGameState("missions")}
                className="w-full bg-combat-red hover:bg-red-600 military-text text-lg py-6"
              >
                <Icon name="Play" className="mr-2" />
                НАЧАТЬ МИССИЮ
              </Button>
              <Button
                variant="outline"
                className="w-full border-combat-red text-white hover:bg-combat-red/20 military-text"
              >
                <Icon name="Settings" className="mr-2" />
                НАСТРОЙКИ
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 military-text"
              >
                <Icon name="Trophy" className="mr-2" />
                РЕКОРДЫ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState === "missions" && (
        <div className="h-screen combat-bg p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="military-text text-4xl text-combat-red mb-2">
                ВЫБОР МИССИИ
              </h1>
              <p className="text-gray-300">Выберите операцию для выполнения</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {missions.map((mission) => (
                <Card
                  key={mission.id}
                  className="bg-black/80 border-gray-600 text-white hover:border-combat-red transition-all duration-300"
                >
                  <CardHeader>
                    <CardTitle className="military-text text-combat-red text-lg">
                      {mission.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Icon
                        name={
                          mission.type === "recon"
                            ? "Eye"
                            : mission.type === "attack"
                              ? "Target"
                              : "Shield"
                        }
                        size={16}
                        className="text-gray-400"
                      />
                      <span className="text-sm text-gray-400 uppercase">
                        {mission.type}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-300">
                      {mission.description}
                    </p>
                    <div className="text-xs text-gray-400">
                      ЦЕЛЬ: {mission.objective}
                    </div>
                    <div className="text-xs text-gray-400">
                      ВРАГОВ: {mission.enemies.length}
                    </div>
                    <Button
                      onClick={() => startMission(mission)}
                      className="w-full bg-combat-red hover:bg-red-600 military-text"
                    >
                      ЗАПУСТИТЬ
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => setGameState("menu")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 military-text"
              >
                <Icon name="ArrowLeft" className="mr-2" />
                НАЗАД В МЕНЮ
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState === "gameplay" && renderGameplay()}

      {gameState === "results" && (
        <div className="h-screen combat-bg flex items-center justify-center">
          <Card className="w-96 bg-black/90 border-combat-red text-white">
            <CardHeader className="text-center">
              <CardTitle className="military-text text-2xl text-combat-red">
                МИССИЯ ЗАВЕРШЕНА
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="military-text text-lg">
                ФИНАЛЬНЫЙ СЧЕТ: <span className="text-combat-red">{score}</span>
              </div>
              <div className="text-sm text-gray-300">
                {health > 0 ? "ДРОН УЦЕЛЕЛ!" : "ДРОН УНИЧТОЖЕН!"}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setGameState("missions")}
                  className="w-full bg-combat-red hover:bg-red-600 military-text"
                >
                  НОВАЯ МИССИЯ
                </Button>
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 military-text"
                >
                  ГЛАВНОЕ МЕНЮ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FPVDroneGame;
