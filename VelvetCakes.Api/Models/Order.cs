using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

[Index("UserId", Name = "IX_Orders_UserId")]
public partial class Order
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = null!;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? PaidAmount { get; set; }

    [StringLength(500)]
    public string? DeliveryAddress { get; set; }

    public string? Comments { get; set; }

    public DateOnly DesiredDeliveryDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [InverseProperty("Order")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    [ForeignKey("UserId")]
    [InverseProperty("Orders")]
    public virtual User User { get; set; } = null!;
}
