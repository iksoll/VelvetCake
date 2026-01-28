using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

public partial class Product
{
    [Key]
    public int Id { get; set; }

    [StringLength(200)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Price { get; set; }

    [StringLength(50)]
    public string? Weight { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    [StringLength(50)]
    public string Category { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Product")]
    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    [InverseProperty("Product")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
