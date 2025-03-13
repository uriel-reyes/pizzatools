import React from 'react';
import './PizzaItem.css';

interface Pizza {
  productName: string;
  ingredients: string[];
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

  return (
    <div className="pizza-container">
      <div className="pizza-info">
        <h4 className="pizza-name">{pizza.productName}</h4>
        <div className="ingredients-container">
          <span className="ingredients-label">Ingredients:</span>
          {hasIngredients ? (
            <ul className="ingredients-list">
              {pizza.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          ) : (
            <span className="ingredients-empty">None specified</span>
          )}
        </div>
      </div>
      <div className="pizza-visual">
        <div className="pizza-icon">
          🍕
        </div>
      </div>
    </div>
  );
};

export default PizzaItem;