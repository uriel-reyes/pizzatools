import React from 'react';
import './PizzaItem.css';

interface Pizza {
  productName: string;
  ingredients: string[];
  quantity?: number;
}

interface PizzaItemProps {
  pizza: Pizza;
}

const PizzaItem: React.FC<PizzaItemProps> = ({ pizza }) => {
  // Debug output
  console.log('Rendering PizzaItem:', pizza);
  
  // Handle missing data gracefully
  if (!pizza || !pizza.productName) {
    console.warn('Invalid pizza data:', pizza);
    return <div className="pizza-container pizza-error">Invalid pizza data</div>;
  }
  
  const hasIngredients = Array.isArray(pizza.ingredients) && pizza.ingredients.length > 0;

  // Determine pizza type based on ingredients
  const getPizzaType = (ingredients: string[]): string => {
    const ingredientsStr = ingredients.join(',');
    
    if (ingredientsStr.includes('pepperoni') && ingredients.length <= 2) return 'pepperoni';
    if (ingredientsStr.includes('cheese') && ingredients.length === 1) return 'cheese';
    if (ingredientsStr.includes('pineapple') && ingredientsStr.includes('ham')) return 'hawaiian';
    if (ingredientsStr.includes('mushroom') && !ingredientsStr.includes('pepperoni') && 
        !ingredientsStr.includes('ham') && !ingredientsStr.includes('bacon')) return 'veggie';
    if (ingredientsStr.includes('pepperoni') && ingredientsStr.includes('ham') && 
        ingredientsStr.includes('bacon')) return 'meat-lovers';
    if (ingredients.length >= 4) return 'supreme';
    
    return '';
  };

  // Format ingredients for display with styling
  const formatIngredients = (ingredients: string[]) => {
    return ingredients.map((ing, index) => (
      <span key={index} className={`topping topping-${ing}`}>
        {ing.charAt(0).toUpperCase() + ing.slice(1)}
      </span>
    ));
  };

  const pizzaType = getPizzaType(pizza.ingredients || []);

  return (
    <div className="pizza-item" data-type={pizzaType}>
      <div className="pizza-item-header">
        <h4 className="pizza-name">{pizza.productName}</h4>
        {pizza.quantity && pizza.quantity > 1 && (
          <span className="pizza-quantity">x{pizza.quantity}</span>
        )}
      </div>
      <div className="pizza-ingredients">
        {pizza.ingredients && pizza.ingredients.length > 0 ? (
          <>
            <span className="ingredients-label">Toppings:</span> {formatIngredients(pizza.ingredients)}
          </>
        ) : (
          <span className="no-ingredients">Plain cheese</span>
        )}
      </div>
    </div>
  );
};

export default PizzaItem;