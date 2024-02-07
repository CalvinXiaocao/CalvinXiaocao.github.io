
import ants, importlib
importlib.reload(ants)
beehive = ants.Hive(ants.AssaultPlan())
dimensions = (2, 9)
gamestate = ants.GameState(None, beehive, ants.ant_types(),
         ants.dry_layout, dimensions, food=20)

# Extensive damage doubling tests
queen_tunnel, side_tunnel = [[gamestate.places['tunnel_{0}_{1}'.format(i, j)]
        for j in range(9)] for i in range(2)]
queen = ants.QueenAnt.construct(gamestate)
queen_tunnel[7].add_insect(queen)
# Turn 0
thrower = ants.ThrowerAnt()
fire = ants.FireAnt()
side = ants.ThrowerAnt()
front = ants.ThrowerAnt()
queen_tunnel[0].add_insect(thrower)
queen_tunnel[1].add_insect(fire)
queen_tunnel[8].add_insect(front)
side_tunnel[0].add_insect(side)
# layout right now
# [thrower, fire, , , , , , queen, front]
# [side   ,     , , , , , ,      ,      ]
thrower.damage, fire.damage = 101, 102
front.damage, side.damage = 104, 105
queen.action(gamestate)

tank = ants.TankAnt()
guard = ants.BodyguardAnt()
queen_tank = ants.TankAnt()
queen_tunnel[6].add_insect(tank)          # Not protecting an ant
queen_tunnel[1].add_insect(guard)         # Guarding FireAnt
queen_tunnel[7].add_insect(queen_tank)    # Guarding QueenAnt
# layout right now
# [thrower, guard/fire, , , , , tank, queen_tank/queen, front]
# [side   ,           , , , , ,     ,                 ,      ]
tank.damage, guard.damage, queen_tank.damage = 1001, 1002, 1003
queen.action(gamestate)
# unchanged

# Turn 2
thrower1 = ants.ThrowerAnt()
thrower2 = ants.ThrowerAnt()
queen_tunnel[6].add_insect(thrower1)      # Add thrower1 in TankAnt
queen_tunnel[5].add_insect(thrower2)
# layout right now
# [thrower, guard/fire, , , , thrower2, tank/thrower1, queen_tank/queen, front]
>>> # [side   ,           , , , ,         ,              ,                 ,      ]
>>> thrower1.damage, thrower2.damage = 10001, 10002
>>> queen.action(gamestate)
>>> (thrower.damage, fire.damage)
(202, 204)
>>> (front.damage, side.damage)
(104, 105)
>>> (tank.damage, guard.damage)
(2002, 2004)
>>> queen_tank.damage
1003
>>> (thrower1.damage, thrower2.damage)
(10001, 20004)

