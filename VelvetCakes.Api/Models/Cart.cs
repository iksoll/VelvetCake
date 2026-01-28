using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

[Table("Cart")]
[Index("UserId", Name = "IX_Cart_UserId")]
public partial class Cart
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? ProductId { get; set; }

    public int? CustomCakeId { get; set; }

    public int Quantity { get; set; }

    public DateTime? AddedAt { get; set; }

    [ForeignKey("CustomCakeId")]
    [InverseProperty("Carts")]
    public virtual CustomCake? CustomCake { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("Carts")]
    public virtual Product? Product { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Carts")]
    public virtual User User { get; set; } = null!;
}
