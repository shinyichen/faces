import sys
import numpy as np
from sklearn.manifold import TSNE
#from pprint import pprint

# given a h-dimension feature vector
# returns a 2D array of t-SNE result
if __name__ == "__main__":
    features_path = sys.argv[1];
    output_path = sys.argv[2];
    X = np.loadtxt(features_path, delimiter=',');
    #pprint(X);
    model = TSNE(n_components=2, random_state=50, perplexity=50)
    Y = model.fit_transform(X)
    np.savetxt(output_path, Y, delimiter=',');

