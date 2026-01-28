using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

public partial class CustomCakeComponent
{
    [Key]
    public int Id { get; set; }

    public int CustomCakeId { get; set; }

    public int ComponentId { get; set; }

    public int Quantity { get; set; }

    [ForeignKey("ComponentId")]
    [InverseProperty("CustomCakeComponents")]
    public virtual Component Component { get; set; } = null!;

    [ForeignKey("CustomCakeId")]
    [InverseProperty("CustomCakeComponents")]
    public virtual CustomCake CustomCake { get; set; } = null!;
}
