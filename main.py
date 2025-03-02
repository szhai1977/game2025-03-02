from soldier import Soldier, EnemySoldier
from tank import Tank
import pygame

# 创建士兵和坦克
soldier = Soldier()
tank = Tank()

# 移动士兵到位置 (10, 10)
soldier.move(10, 10)

# 移动坦克到士兵的位置，触发碰撞
tank.move(10, 10)
tank.collide_with_soldier(soldier)

# 检查坦克状态
print(f"坦克状态: {'存活' if tank.is_alive else '已摧毁'}")
print(f"坦克生命值: {tank.health}")

# 士兵仍然可以发射子弹
soldier.shoot()

# 获取发射的子弹
bullets = soldier.get_bullets()
for bullet in bullets:
    bullet.hit()

# 创建敌人坦克
enemy_tank = Tank()

# 移动敌人坦克到位置 (20, 20)
enemy_tank.move(20, 20)

# 检查敌人坦克状态
print(f"敌人坦克状态: {'存活' if enemy_tank.is_alive else '已摧毁'}")
print(f"敌人坦克生命值: {enemy_tank.health}")

# 创建敌人士兵
enemy_soldier1 = EnemySoldier()
enemy_soldier2 = EnemySoldier()

# 移动敌人士兵到不同位置
enemy_soldier1.move(30, 30)
enemy_soldier2.move(40, 40)

# 敌人士兵攻击
enemy_soldier1.attack()
enemy_soldier2.attack()

# 定义敌人士兵的位置
enemy_soldier1_pos = [30, 30]
enemy_soldier2_pos = [40, 40]

# 初始化Pygame
pygame.init()

# 设置屏幕尺寸
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption('坦克与士兵')

# 定义颜色
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)

# 定义坦克和士兵的尺寸
TANK_SIZE = (50, 50)
SOLDIER_SIZE = (30, 30)

# 定义坦克和士兵的位置
soldier_pos = [10, 10]
tank_pos = [10, 10]
enemy_tank_pos = [20, 20]

# 加载自定义光标图像
custom_cursor = pygame.image.load('custom_cursor.png')

# 隐藏默认光标
pygame.mouse.set_visible(False)

# 游戏主循环
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 填充背景
    screen.fill(WHITE)

    # 绘制士兵
    pygame.draw.rect(screen, GREEN, (*soldier_pos, *SOLDIER_SIZE))

    # 绘制坦克
    pygame.draw.rect(screen, RED, (*tank_pos, *TANK_SIZE))

    # 绘制敌人坦克
    pygame.draw.rect(screen, RED, (*enemy_tank_pos, *TANK_SIZE))

    # 绘制敌人士兵
    pygame.draw.rect(screen, GREEN, (*enemy_soldier1_pos, *SOLDIER_SIZE))
    pygame.draw.rect(screen, GREEN, (*enemy_soldier2_pos, *SOLDIER_SIZE))

    # 绘制士兵的血条
    pygame.draw.rect(screen, RED, (soldier_pos[0], soldier_pos[1] - 10, SOLDIER_SIZE[0], 5))
    pygame.draw.rect(screen, GREEN, (soldier_pos[0], soldier_pos[1] - 10, SOLDIER_SIZE[0] * (soldier.health / 100), 5))

    # 获取鼠标位置
    mouse_x, mouse_y = pygame.mouse.get_pos()

    # 绘制自定义光标
    screen.blit(custom_cursor, (mouse_x, mouse_y))

    # 更新显示
    pygame.display.flip()

# 退出Pygame
pygame.quit() 