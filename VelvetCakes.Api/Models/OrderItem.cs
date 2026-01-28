using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

[Index("OrderId", Name = "IX_OrderItems_OrderId")]
public partial class OrderItem
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int? ProductId { get; set; }

    public int? CustomCakeId { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal UnitPrice { get; set; }

    [ForeignKey("CustomCakeId")]
    [InverseProperty("OrderItems")]
    public virtual CustomCake? CustomCake { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("OrderItems")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("ProductId")]
    [InverseProperty("OrderItems")]
    public virtual Product? Product { get; set; }
}
