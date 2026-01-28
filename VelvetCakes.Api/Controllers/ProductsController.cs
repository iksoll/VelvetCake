using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VelvetCakes.Api.Models;

namespace VelvetCakes.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ProductsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetProducts(string category = "cheesecakes")
    {
        var products = await _db.Products
            .Where(p => p.Category == category)
            .ToListAsync();
        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> Create([FromBody] Product product)
    {
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return Ok(product);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> Update(int id, [FromBody] Product updated)
    {
        var existing = await _db.Products.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = updated.Name;
        existing.Description = updated.Description;
        existing.Price = updated.Price;
        existing.Weight = updated.Weight;
        existing.ImageUrl = updated.ImageUrl;
        existing.Category = updated.Category;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return Ok();
    }
}