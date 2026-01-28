using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

public partial class Component
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string Type { get; set; } = null!;

    [StringLength(100)]
    public string Name { get; set; } = null!;

    [StringLength(200)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal BasePricePerUnit { get; set; }

    public int? ComplexityPoints { get; set; }

    public bool? IsSeasonal { get; set; }

    public DateOnly? SeasonStart { get; set; }

    public DateOnly? SeasonEnd { get; set; }

    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Component")]
    public virtual ICollection<CustomCakeComponent> CustomCakeComponents { get; set; } = new List<CustomCakeComponent>();
}
