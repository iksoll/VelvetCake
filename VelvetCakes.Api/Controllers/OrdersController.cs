using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VelvetCakes.Api.Models;

namespace VelvetCakes.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public OrdersController(ApplicationDbContext db) => _db = db;

    [HttpPost]
    [Authorize(Roles = "user")]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var order = new Order
        {
            UserId = userId,
            Status = "Новый",
            TotalAmount = dto.Total,
            DeliveryAddress = dto.DeliveryAddress,
            Comments = dto.Comments,
            DesiredDeliveryDate = DateOnly.Parse(dto.DeliveryDate),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        foreach (var item in dto.Items)
        {
            OrderItem orderItem;
            if (item.ProductId.HasValue)
            {
                orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price
                };
            }
            else
            {
                var customCake = new CustomCake
                {
                    UserId = userId,
                    Name = item.Name ?? "Индивидуальный торт",
                    Description = item.Description,
                    Weight = item.Weight,
                    TotalPrice = item.Price,
                    DeliveryDate = DateOnly.Parse(dto.DeliveryDate),
                    CreatedAt = DateTime.UtcNow
                };
                _db.CustomCakes.Add(customCake);
                await _db.SaveChangesAsync();

                orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    CustomCakeId = customCake.Id,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price
                };
            }
            _db.OrderItems.Add(orderItem);
        }
        await _db.SaveChangesAsync();

  
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = $"Заказ №{order.Id} принят",
            Text = $"Ваш заказ на сумму {dto.Total} ₽ принят в работу. Статус: \"Новый\".",
            SentAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        return Ok(order);
    }

    [HttpGet]
    [Authorize(Roles = "manager,pastry_chef")]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.CustomCake)
            .ToListAsync();
        return Ok(orders);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "manager,pastry_chef")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        var order = await _db.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound();

        var oldStatus = order.Status;

        if (oldStatus != dto.Status)
        {
            order.Status = dto.Status;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _db.Notifications.Add(new Notification
            {
                UserId = order.UserId,
                Title = $"Статус заказа №{id} обновлён",
                Text = $"Статус изменён с \"{oldStatus}\" на \"{dto.Status}\".",
                SentAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        return Ok(order);
    }
}

public class CreateOrderDto
{
    public decimal Total { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Comments { get; set; }
    public string DeliveryDate { get; set; } = string.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int? ProductId { get; set; }
    public string? Name { get; set; }   
    public string? Description { get; set; }
    public decimal Weight { get; set; }  
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class UpdateStatusDto
{
    public string Status { get; set; } = "Новый";
}