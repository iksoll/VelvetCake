using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

[Index("UserId", Name = "IX_CustomCakes_UserId")]
public partial class CustomCake
{
    [Key]
    public int Id { get; set; }

    public int? UserId { get; set; }

    [StringLength(200)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(4, 2)")]
    public decimal Weight { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal TotalPrice { get; set; }

    public string? DesignNotes { get; set; }

    public DateOnly DeliveryDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    [InverseProperty("CustomCake")]
    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    [InverseProperty("CustomCake")]
    public virtual ICollection<CustomCakeComponent> CustomCakeComponents { get; set; } = new List<CustomCakeComponent>();

    [InverseProperty("CustomCake")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    [ForeignKey("UserId")]
    [InverseProperty("CustomCakes")]
    public virtual User? User { get; set; }
}
