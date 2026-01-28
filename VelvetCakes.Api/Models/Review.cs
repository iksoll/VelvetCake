using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

public partial class Review
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Text { get; set; } = null!;

    public int? Rating { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? AuthorName { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Reviews")]
    public virtual User User { get; set; } = null!;
}
