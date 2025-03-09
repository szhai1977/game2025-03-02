from soldier import Soldier, EnemySoldier
from tank import Tank
import pygame
import random
import time
import math

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
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
BLACK = (0, 0, 0)
DARK_GREEN = (0, 100, 0)  # 深绿色用于UI

# 定义坦克和士兵的尺寸
TANK_SIZE = (50, 50)
SOLDIER_SIZE = (30, 30)

# 定义坦克和士兵的位置
soldier_pos = [10, 10]
tank_pos = [400, 300]  # 将玩家坦克放在屏幕中央
enemy_tank_pos = [20, 20]

# 重置坦克状态（确保坦克是活的，因为前面的代码可能已经将其摧毁）
tank = Tank()
tank.move(tank_pos[0], tank_pos[1])

# 重置敌人士兵
enemy_soldier1 = EnemySoldier()
enemy_soldier2 = EnemySoldier()
enemy_soldier1.move(enemy_soldier1_pos[0], enemy_soldier1_pos[1])
enemy_soldier2.move(enemy_soldier2_pos[0], enemy_soldier2_pos[1])

# 敌人攻击计时器
last_enemy_attack_time = time.time()
enemy_attack_interval = 2.0  # 敌人每2秒攻击一次

# 攻击效果变量
show_attack_effect = False
attack_effect_start_time = 0
attack_effect_pos = [0, 0]
attack_damage = 0

# 加载自定义光标图像
try:
    custom_cursor = pygame.image.load('custom_cursor.png')
    # 隐藏默认光标
    pygame.mouse.set_visible(False)
except:
    print("无法加载自定义光标图像，使用默认光标")
    pygame.mouse.set_visible(True)

# 游戏状态
game_over = False
font = pygame.font.Font(None, 36)
small_font = pygame.font.Font(None, 24)  # 添加一个小一点的字体用于UI

# 游戏主循环
running = True
while running:
    current_time = time.time()
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # 填充背景
    screen.fill(WHITE)
    
    # 绘制士兵
    pygame.draw.rect(screen, GREEN, (*soldier_pos, *SOLDIER_SIZE))
    
    # 绘制玩家坦克（如果还活着）
    if tank.is_alive:
        pygame.draw.rect(screen, BLUE, (*tank_pos, *TANK_SIZE))
        
        # 绘制坦克的血条 - 修改为更明显的显示方式
        health_bar_width = TANK_SIZE[0]
        health_bar_height = 15  # 增加血条高度
        health_percentage = tank.get_health_percentage()
        
        # 血条位置 - 移到坦克上方更远的位置
        health_bar_y = tank_pos[1] - 25
        
        # 血条边框（黑色）
        pygame.draw.rect(screen, (0, 0, 0), 
                         (tank_pos[0] - 2, health_bar_y - 2, 
                          health_bar_width + 4, health_bar_height + 4), 2)
        
        # 血条背景（红色）
        pygame.draw.rect(screen, RED, 
                         (tank_pos[0], health_bar_y, 
                          health_bar_width, health_bar_height))
        
        # 当前血量（绿色）
        pygame.draw.rect(screen, GREEN, 
                         (tank_pos[0], health_bar_y, 
                          health_bar_width * health_percentage, health_bar_height))
        
        # 添加血量文字标签
        health_text = font.render(f"HP: {int(tank.health)}/{tank.max_health}", True, (255, 255, 255))
        # 创建一个黑色背景使文字更容易看见
        text_bg = pygame.Surface((health_text.get_width() + 10, health_text.get_height() + 6))
        text_bg.fill((0, 0, 0))
        text_bg.set_alpha(150)  # 半透明背景
        screen.blit(text_bg, (tank_pos[0] + TANK_SIZE[0]/2 - health_text.get_width()/2 - 5, health_bar_y - 30))
        screen.blit(health_text, (tank_pos[0] + TANK_SIZE[0]/2 - health_text.get_width()/2, health_bar_y - 27))
        
        # 添加固定位置的生命值显示 - 屏幕顶部
        # 创建一个半透明的黑色背景面板
        ui_panel = pygame.Surface((200, 50))
        ui_panel.fill((0, 0, 0))
        ui_panel.set_alpha(180)
        screen.blit(ui_panel, (10, 10))
        
        # 添加生命值文字和图标
        health_icon_text = font.render("❤️", True, RED)  # 使用心形图标
        screen.blit(health_icon_text, (20, 20))
        
        # 生命值文字
        health_display = font.render(f"{int(tank.health)}/{tank.max_health}", True, WHITE)
        screen.blit(health_display, (60, 20))
        
        # 生命值条
        # 外边框
        pygame.draw.rect(screen, WHITE, (110, 25, 90, 20), 2)
        # 填充背景
        pygame.draw.rect(screen, RED, (112, 27, 86, 16))
        # 当前生命值
        pygame.draw.rect(screen, GREEN, (112, 27, 86 * health_percentage, 16))
        
        # 添加移动设备友好的生命值显示 - 屏幕底部
        # 获取屏幕尺寸
        screen_width, screen_height = screen.get_size()
        
        # 创建一个圆形生命值显示在屏幕右下角
        health_circle_radius = 40
        health_circle_pos = (screen_width - health_circle_radius - 20, screen_height - health_circle_radius - 20)
        
        # 绘制圆形背景
        pygame.draw.circle(screen, BLACK, health_circle_pos, health_circle_radius)
        pygame.draw.circle(screen, WHITE, health_circle_pos, health_circle_radius, 2)  # 白色边框
        
        # 绘制生命值填充 - 使用简单的环形进度条
        if health_percentage > 0:
            # 绘制环形进度条
            pygame.draw.circle(screen, RED, health_circle_pos, health_circle_radius - 5)
            
            # 计算填充角度
            start_angle = -90  # 从顶部开始
            end_angle = start_angle + (360 * health_percentage)
            
            # 绘制扇形 - 使用多个小扇形近似
            for angle in range(int(start_angle), int(end_angle), 5):
                rad_angle = angle * 3.14159 / 180
                next_rad_angle = (angle + 5) * 3.14159 / 180
                
                # 计算扇形的点
                x1 = health_circle_pos[0] + (health_circle_radius - 8) * math.cos(rad_angle)
                y1 = health_circle_pos[1] + (health_circle_radius - 8) * math.sin(rad_angle)
                x2 = health_circle_pos[0] + (health_circle_radius - 8) * math.cos(next_rad_angle)
                y2 = health_circle_pos[1] + (health_circle_radius - 8) * math.sin(next_rad_angle)
                
                # 绘制三角形
                pygame.draw.polygon(screen, GREEN, [
                    health_circle_pos,
                    (int(x1), int(y1)),
                    (int(x2), int(y2))
                ])
        
        # 在圆形中心显示生命值数字
        health_number = font.render(f"{int(tank.health)}", True, WHITE)
        health_number_rect = health_number.get_rect(center=health_circle_pos)
        screen.blit(health_number, health_number_rect)
        
        # 添加一个更明显的生命值图标和文字在屏幕底部中央
        health_bar_bottom = pygame.Surface((200, 40))
        health_bar_bottom.fill(BLACK)
        health_bar_bottom.set_alpha(200)
        health_bar_bottom_pos = (screen_width // 2 - 100, screen_height - 50)
        screen.blit(health_bar_bottom, health_bar_bottom_pos)
        
        # 绘制生命值图标
        health_icon = font.render("♥", True, RED)
        screen.blit(health_icon, (health_bar_bottom_pos[0] + 10, health_bar_bottom_pos[1] + 5))
        
        # 绘制生命值文字
        health_text_bottom = font.render(f"生命值: {int(tank.health)}", True, WHITE)
        screen.blit(health_text_bottom, (health_bar_bottom_pos[0] + 40, health_bar_bottom_pos[1] + 5))
        
        # 绘制生命值条
        pygame.draw.rect(screen, WHITE, 
                        (health_bar_bottom_pos[0] + 10, health_bar_bottom_pos[1] + 30, 
                         180, 5), 1)
        pygame.draw.rect(screen, GREEN, 
                        (health_bar_bottom_pos[0] + 11, health_bar_bottom_pos[1] + 31, 
                         178 * health_percentage, 3))
    else:
        # 如果坦克被摧毁，显示游戏结束
        game_over = True
    
    # 绘制敌人坦克
    pygame.draw.rect(screen, RED, (*enemy_tank_pos, *TANK_SIZE))
    
    # 绘制敌人士兵
    pygame.draw.rect(screen, YELLOW, (*enemy_soldier1_pos, *SOLDIER_SIZE))
    pygame.draw.rect(screen, YELLOW, (*enemy_soldier2_pos, *SOLDIER_SIZE))
    
    # 绘制士兵的血条
    pygame.draw.rect(screen, RED, (soldier_pos[0], soldier_pos[1] - 10, SOLDIER_SIZE[0], 5))
    pygame.draw.rect(screen, GREEN, (soldier_pos[0], soldier_pos[1] - 10, SOLDIER_SIZE[0] * (soldier.health / 100), 5))
    
    # 敌人攻击逻辑
    if not game_over and current_time - last_enemy_attack_time >= enemy_attack_interval:
        if tank.is_alive:
            # 随机选择一个敌人进行攻击
            attacker = random.choice(["enemy_tank", "enemy_soldier1", "enemy_soldier2"])
            
            # 设置攻击视觉效果变量
            show_attack_effect = True
            attack_effect_start_time = current_time
            
            if attacker == "enemy_tank":
                print("敌人坦克发动攻击！")
                damage = random.randint(10, 20)  # 坦克伤害更高
                tank.take_damage(damage)
                attack_effect_pos = enemy_tank_pos.copy()
                attack_damage = damage
            elif attacker == "enemy_soldier1":
                enemy_soldier1.attack_tank(tank)
                attack_effect_pos = enemy_soldier1_pos.copy()
                attack_damage = enemy_soldier1.attack_power
            else:
                enemy_soldier2.attack_tank(tank)
                attack_effect_pos = enemy_soldier2_pos.copy()
                attack_damage = enemy_soldier2.attack_power
                
            # 更新攻击时间
            last_enemy_attack_time = current_time
    
    # 显示攻击视觉效果
    if show_attack_effect:
        # 计算攻击效果持续时间（0.5秒）
        if current_time - attack_effect_start_time < 0.5:
            # 绘制从敌人到坦克的攻击线
            pygame.draw.line(screen, RED, 
                            (attack_effect_pos[0] + SOLDIER_SIZE[0]/2, attack_effect_pos[1] + SOLDIER_SIZE[1]/2),
                            (tank_pos[0] + TANK_SIZE[0]/2, tank_pos[1] + TANK_SIZE[1]/2), 
                            3)
            
            # 在坦克上方显示伤害数字
            damage_text = font.render(f"-{attack_damage}", True, RED)
            screen.blit(damage_text, (tank_pos[0] + TANK_SIZE[0]/2, tank_pos[1] - 40))
        else:
            show_attack_effect = False
    
    # 如果游戏结束，显示游戏结束文本
    if game_over:
        game_over_text = font.render("游戏结束! 坦克被摧毁", True, RED)
        restart_text = font.render("按R键重新开始", True, GREEN)
        screen.blit(game_over_text, (300, 250))
        screen.blit(restart_text, (320, 300))
        
        # 检查是否按下R键重新开始游戏
        keys = pygame.key.get_pressed()
        if keys[pygame.K_r]:
            # 重置游戏状态
            tank = Tank()
            tank.move(tank_pos[0], tank_pos[1])
            game_over = False
            # 重置攻击效果
            show_attack_effect = False
    
    # 获取鼠标位置
    mouse_x, mouse_y = pygame.mouse.get_pos()
    
    # 如果加载了自定义光标，则绘制它
    try:
        screen.blit(custom_cursor, (mouse_x, mouse_y))
    except:
        pass  # 如果没有自定义光标，不做任何事
    
    # 更新显示
    pygame.display.flip()
    
    # 控制游戏帧率
    pygame.time.delay(30)

# 退出Pygame
pygame.quit() 