using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

[Index("Email", Name = "IX_Users_Email")]
public partial class User
{
    [Key]
    public int Id { get; set; }

    [StringLength(255)]
    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    [StringLength(100)]
    public string? FullName { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    public int RoleId { get; set; }

    public DateTime? CreatedAt { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    [InverseProperty("User")]
    public virtual ICollection<CustomCake> CustomCakes { get; set; } = new List<CustomCake>();

    [InverseProperty("User")]
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    [InverseProperty("User")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [InverseProperty("User")]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [ForeignKey("RoleId")]
    [InverseProperty("Users")]
    public virtual Role Role { get; set; } = null!;
}
